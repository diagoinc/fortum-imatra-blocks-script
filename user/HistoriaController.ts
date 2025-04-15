/*
  Copyright (c) 2025 Diago Global Inc. All Rights Reserved.
 */


import {PropertyAccessor, Script, ScriptEnv} from 'system_lib/Script';
import {PrimitiveValue} from 'system_lib/ScriptBase';
import {Network} from 'system/Network';
import {property, resource} from 'system_lib/Metadata';

const BUTTON1 = "Network['4_Xtalk_Historia'].element.Buttons.button1";
const BUTTON2 = "Network['4_Xtalk_Historia'].element.Buttons2.button1";
const BUTTON3 = "Network['4_Xtalk_Historia'].element.Buttons2.button2";
const BUTTON4 = "Network['4_Xtalk_Historia'].element.Buttons2.button4";
const LED1 = "Network['4_Xtalk_Historia'].element.Buttons.led1";
const LED2 = "Network['4_Xtalk_Historia'].element.Buttons2.led1";
const LED3 = "Network['4_Xtalk_Historia'].element.Buttons2.led2";
const LED4 = "Network['4_Xtalk_Historia'].element.Buttons2.led4";
const ROTARY1 = "Network['4_Xtalk_Historia'].element.Rotary1.rotation";
const ROTARY2 = "Network['4_Xtalk_Historia'].element.Rotary2.rotation";
const ROTARY3 = "Network['4_Xtalk_Historia'].element.Rotary3.rotation";
const ROTARY4 = "Network['4_Xtalk_Historia'].element.Rotary4.rotation";

const NO_EVENT = '';

export class HistoriaController extends Script {
	private _event: string = NO_EVENT;
	private currentGroup: number | null = null;
	private awaiter: CancelablePromise<void> | undefined = undefined;

	private led1: PropertyAccessor<number>;
	private led2: PropertyAccessor<number>;
	private led3: PropertyAccessor<number>;
	private led4: PropertyAccessor<number>;

	@property('Event', true)
	public get event(): string {
		return this._event;
	}

	@resource(undefined, 'POST')
	public restSetIdle(...args: any[]): any {
		this.currentGroup = null;
		this.setLED(0);
		return {};
	}

	public constructor(env: ScriptEnv) {
		super(env);

		this.led1 = this.getProperty(LED1);
		this.led2 = this.getProperty(LED2);
		this.led3 = this.getProperty(LED3);
		this.led4 = this.getProperty(LED4);
		this.getProperty(BUTTON1, (value: boolean) => this.handleButton(1, value));
		this.getProperty(BUTTON2, (value: boolean) => this.handleButton(2, value));
		this.getProperty(BUTTON3, (value: boolean) => this.handleButton(3, value));
		this.getProperty(BUTTON4, (value: boolean) => this.handleButton(4, value));
		this.getProperty(ROTARY1, (value: number) => this.handleRotation(1, value));
		this.getProperty(ROTARY2, (value: number) => this.handleRotation(2, value));
		this.getProperty(ROTARY3, (value: number) => this.handleRotation(3, value));
		this.getProperty(ROTARY4, (value: number) => this.handleRotation(4, value));
	}

	private handleButton(group: number, value: boolean) {
		if (!value || this.currentGroup != group) {
			return;
		}
		this.triggerEvent('PLAY');
	}

	private handleRotation(group: number, value: number) {
		if (value == 0) {
			return;
		}
		console.log('rotate', group, value);
		if (this.currentGroup != group) {
			this.currentGroup = group;
			this.setLED(this.currentGroup);
		}
		this.triggerEvent(`GO:${group - 1}:${value}`);
	}

	private triggerEvent(event: string) {
		this._event = event;
		this.changed('event');
		if (this.awaiter) {
			this.awaiter.cancel();
		}
		this.awaiter = wait(100);
		this.awaiter.then(() => {
			this._event = NO_EVENT;
			this.awaiter = undefined;
		});
	}

	private setLED(ledNum: number) {
		this.led1.value = ledNum == 1 ? 3 : 0;
		this.led2.value = ledNum == 2 ? 3 : 0;
		this.led3.value = ledNum == 3 ? 3 : 0;
		this.led4.value = ledNum == 4 ? 3 : 0;
	}
}
