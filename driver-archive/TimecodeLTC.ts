/** Blocks driver for providing time from an LTC (SMPTE or EBU) timecode source.

	There are two options for receiving the LTC audio-level timecode signal:

	1. Using the audio input of a Linux computer, such as a our Linux based
	server image, running our 'timecode-reader' program. This program is located
	in the native directory located in the home directory of the pixi-server
	user, and must be run from there since it depends on other components
	located in the directory. Add to Blocks as a Network TCP/UDP Device, specifying this
	driver. If you run the 'timecode-reader' program on your Blocks server, set
	the the IP address to localhost (or 127.0.0.1) . If you run the program on
	another computer then enter the IP address of that computer.

 	2. Using the timecode reader "dongle" from joananton@joananton.com. This
 	must be connected to a USB port on a PIXILAB Player (e.g., NUC). Add to
 	Blocks as a Network Serial Device, specifying this driver. Specify the name
 	of (or full, dot-separated path to) the Display Spot to which the USB
 	dongle is connected in the "Connected through Spot" field. More info here:
 	https://youtube.com/playlist?list=PLC8ugsKcEiLSQ4Uh95o6x1U41qk1aHBuH
 	https://youtu.be/VY9kEkZim_k?si=a6x0Ltv8wJJObBlS

	Finally, you must configure the driver for the expected timecode type. This
	can be done in either of the following ways:

 	A. Set the 'type' property of this Network Device to the expected type.
 	This can be done using a Task triggered on system start-up or the 'connected'
 	property of this driver (which becomes true once the 'timecode-reader' program
 	appears on the network).

 	B. Set options using JSON data in the "Custom Options" field of the Network
 	Device, like this: {"type": "29.97_drop", "offset": 0.0}
 	See kTypeMap below for valid type names.

 	Copyright (c) 2024 PIXILAB Technologies AB, Sweden (http://pixilab.se).
 	All Rights Reserved.
 */

import {NetworkUDP, SerialPort} from "system/Network";
import {Driver} from "system_lib/Driver";
import {driver, property} from "system_lib/Metadata";
import {SGOptions} from "system/PubSub";
import {Dictionary} from "system_lib/ScriptBase";

/**
 * Maps enumValues to param type, Keys must match enumValues in type property
 */
const kTypeMap: Dictionary<TypeInfo> = {
	"24": { parName: "24", fps: 24},
	"25": { parName: "25", fps: 25},
	"29.97_drop": { parName: "df", fps: 29.97},
	"29.97_nondrop": { parName: "ndf", fps: 29.97},
	"30": { parName: "30", fps: 30}
}

/**
 * Custom driver options for setting initial state. Or you can use a task to set
 * properties as desired when my 'connect' property becomes true.
 */
interface Config {
	type?: string;		// One of the kTypeMap keys above
	offset?: number;	// Added to timecode received, in seconds (with fractions)
}

type ConnType = NetworkUDP | SerialPort;

@driver('NetworkUDP', { port: 1632, rcvPort: 1633 })
@driver('SerialPort', {baudRate: 115200})
export class TimecodeLTC extends Driver<ConnType> {
	private mType = "25";	// Deffault timecode type
	private mTime: TimeFlow = new TimeFlow(0, 0);
	private mSpeed = 0;
	private mVolume = 0;
	private mOffset = 0;
	private mOffsetMs = 0;
	private mResetOnStop = false;

	private mConnected = false;
	private lastDataTime = 0;	// Timestamp when data last received

	// Timer used to send settings to peer every now and then
	private settingsTimer: CancelablePromise<any>;

	// Timer to implement somewhat deferred reset on stop behacior
	private resetOnStopTimer: CancelablePromise<any>;
	private isReset = false;	// Set while reset, to ignore any non-playing data

	private toldOldversion: boolean;	// Do not nag about old version

	public constructor(private connection: ConnType) {
		super(connection);
		if (connection.options) {	// Set initial state from options
			let config = JSON.parse(connection.options) as Config;
			if (config.type) {
				// toString in case user passed a number
				const sType = config.type.toString();
				if (kTypeMap[sType])
					this.mType = sType;
				else
					console.error("Invalid type in config", sType);
			}
			const offs = config.offset;
			if (offs && typeof offs === "number")
				this.offset = offs;
		}

		// Declare enumerated "type" property, and its possible values
		const typePropOpts: SGOptions = {
			type: "Enum",
			description: "Expected type of timecode",
			enumValues: [
				"24",
				"25",
				"29.97_drop",
				"29.97_nondrop",
				"30"
			]
		};
		this.property<string>("type", typePropOpts, newValue => {
			if (this.mType !== newValue && kTypeMap[newValue]) {
				this.mType = newValue;
				this.applySettingsSoon();
			}
			return this.mType;
		});


		/*	Both Serial and UDP support textReceived providing message.text so this is OK.
			The cast is just needed to keep TypeScript compiler happy. Alternatively,
			a type check could have been used, but the code in both branches would end
			up being the same anyway, so no need really.
		 */
		(<NetworkUDP>connection).subscribe('textReceived', (sender, message) => {
			this.dataReceived(message.text.trim());
		});

		this.applySettingsSoon();	// Apply settings initially and then auto-repeat
	}

	@property("The current time position", true)
	get time(): TimeFlow { return this.mTime; }
	set time(t: TimeFlow) { this.mTime = t; }

	@property("Playback rate, with 1 being normal", true)
	get speed(): number { return this.mSpeed; }
	set speed(value: number) { this.mSpeed = value; }

	@property("Signal volume, with 1 being 'overload'", true)
	get volume(): number { return this.mVolume; }
	set volume(value: number) { this.mVolume = value; }

	@property("Received data from peer", true)
	get connected(): boolean { return this.mConnected;}
	set connected(value: boolean) { this.mConnected = value;}

	@property("Offset added to timecode received, in seconds. May be negative.")
	get offset(): number { return this.mOffset; }
	set offset(value: number) {
		this.mOffset = value;
		this.mOffsetMs = Math.round(value * 1000);
	}

	@property("Auto reset time position to 0 when timecode stops")
	get resetOnStop(): boolean { return this.mResetOnStop; }
	set resetOnStop(value: boolean) {
		this.mResetOnStop = value;
		if (!value)
			this.isReset = false; // Can no longer be
	}

	/**
	 * Settings have changed - need to tell peer.
	 */
	private applySettingsSoon(howSoon = 100) {
		if (this.settingsTimer)
			this.settingsTimer.cancel();
		this.settingsTimer = wait(howSoon);
		this.settingsTimer.then(() => this.applySettings());
	}

	/**
	 * Apply my current settings to peer, and then repeat this every now and then
	 * since we're running on UDP, and can't know if peer goes away for a while.
	 */
	private applySettings() {
		const kinterval = 2000;	// Longest interval for updates from peer
		var portOpt = "";		// Not used in serial case
		const isSerial = !!this.connection.isOfTypeName("Serial");
		if (!isSerial) // Specify UDP network port to send data to
			portOpt = "/p/" + (<NetworkUDP>this.connection).listenerPort;
		var settings: string = "i/" + kinterval +
			"/t/" + kTypeMap[this.mType].parName +
			portOpt +
			"/n/1/c/0/w/150/f/2";	// Frames but no timecode, free-wheel 150 mS
		if (isSerial) // Needs explicit line termination
			settings += '\r';
		this.connection.sendText(settings);

		/*	Since this happens with some regularity, check "connection"
			status here as well. Will lag a bit, but will be
			OK within whatewver is my period time.
		 */
		if (this.getMonotonousMillis() - this.lastDataTime >= kinterval*2)
			this.connected = false;	// Long time no see

		this.applySettingsSoon(5000);	// Do this again in a bit
	}

	/**
	 * Got a new message from peer. Publish as TimeFlow
	 */
	private dataReceived(msg: string) {
		// console.log(msg);
		const itemPairs = msg.split('/');
		const pieceCount = itemPairs.length;
		if (pieceCount % 2 || pieceCount < 8) // must be even and hold enough data
			console.error("Invalid data from peer", msg);
		const item: Dictionary<string> = {};	// Params keyed by their 1-char "name"
		for (var ix = 0; ix < pieceCount; ix += 2)
			item[itemPairs[ix]] = itemPairs[ix + 1];

		const version = parseFloat( item['v']);
		if (version < 1.1) {
			if (!this.toldOldversion) {
				console.error("Requires version 1.1 or later of the timecode-reader program");
				this.toldOldversion = true;	// Only say so once
			}
			return;	// Do nothing - remains disconnected
		}
		this.toldOldversion = false;	// OK version - clear this flag

		const sigLevel = item['l'];
		if (sigLevel) {
			// This is dbFS in the range -64...0, which we normalize to 0...1
			var val = ((parseFloat(sigLevel) + 64) / 64);
			this.volume = Math.max(0, Math.min(1, val)); // Clip to 0...1
		}

		const now = this.getMonotonousMillis();
		const frameNum = item['n'];
		if (frameNum) {
			this.updateTime(
				now,
				parseFloat(item['s']),	// Speed
				parseInt(frameNum),
				parseInt(item['t']),	// Timecode reader sample time
				item['a'] === '1'
			);
		}

		this.connected = true;
		this.lastDataTime = now;	// To detect data timeout
	}

	// Last frame state used only in updateTime below
	private lastSampleTime: number;
	private lastServerTime: number;

	/*	The time data I received is always "in the past" due to sampling, conversion
		and variable network latency, etc. Time position granularity is quantized by
		the framerate. The sampleTime parameter holds the timecode-reader audio
		sample clock time at the end of frameNum.
		a
	 */
	private updateTime(
		serverTime: number, // Server time now, mS
		speed: number,		// 0 if not moving, 1 if moving at normal rate
		frameNum: number, 	// Received frame number
		sampleTime: number, // Timecode reader sample time, mS
		abrupt: boolean		// Abrupt change in frameNum position was detected
	) {
		// Frame number to milliseconds
		var millis = Math.round(frameNum / kTypeMap[this.mType].fps * 1000);

		const playing = speed > 0;

		if (!playing && this.isReset)
			return;	// Ignore new data until playing again after reset
		this.isReset = false;	// No longer reset

		const playingStateChanged = playing !== !!this.speed;
		if (playingStateChanged)
			abrupt = true;

		var elapsedDelta = 0;
		if (abrupt || !playing) {
			if (this.time.rate !== speed || this.time.position !== millis) { // This is news
				this.time = new TimeFlow(millis, speed, undefined, false /*	, serverTime*/);
				// console.log("abrupt millis", millis, "speed", speed);
			}
		} else {
			/*	Presumably continuous playback - adjust for elapsed time delta
				between my and timecode-reader's time coordinate systems.
			 */
			const elapsedServerTime = (serverTime - this.lastServerTime) * this.speed;
			const elapsedSampleTime = sampleTime - this.lastSampleTime;
			elapsedDelta = elapsedServerTime - elapsedSampleTime;
			// const rawMillis = millis;
			millis += elapsedDelta + this.mOffsetMs;

			/*
			const extrapolated = this.time.currentTime;
			const extrapolated = this.time.extrapolate(serverTime);
			console.log(
				// "serverTime", serverTime,
				"elapsedServerTime", elapsedServerTime,
				"elapsedSampleTime", elapsedSampleTime,
				"elapsedDelta", elapsedDelta,
				"rawMillis", rawMillis,
				"millis", millis,
				"extrapolated", extrapolated,
				"millisExtrDelta", millis - extrapolated,
				// "speed", speed
			);
			 */
			this.time = new TimeFlow(millis, speed, undefined, false /*	, serverTime*/);
		}

		// On stop/start, handle any reset-on-stop functionality
		if (playingStateChanged) {
			if (!playing) {
				if (this.mResetOnStop) {
					// Hold your horses a bit
					this.resetOnStopTimer = wait(400);
					this.resetOnStopTimer.then(() => {
						this.resetOnStopTimer = undefined;	// Now taken
						// Set time position to zero
						this.time = new TimeFlow(0, 0, undefined, false /*	, serverTime*/);
						this.isReset = true;
					});
				}
			} else if (this.resetOnStopTimer) {
				// Got going again - cancel deferred reset
				this.resetOnStopTimer.cancel();
				this.resetOnStopTimer = undefined;
				this.isReset = false;
			}
		}

		this.speed = speed;
		this.lastSampleTime = sampleTime;
		this.lastServerTime = serverTime - elapsedDelta;
	}
}

interface TypeInfo {
	parName: string;	// Parameter sent to peer
	fps: number;		// Expected, nominal frames per second
}

