/*
  Copyright (c) 2025 Diago Global Inc. All Rights Reserved.
 */


import {PropertyAccessor, Script, ScriptEnv} from 'system_lib/Script';
import {PrimitiveValue} from 'system_lib/ScriptBase';
import {Network} from 'system/Network';
import {property} from 'system_lib/Metadata';

const BUTTON1 = "Network['4_Xtalk_Historia'].element.Buttons.button1";
const BUTTON2 = "Network['4_Xtalk_Historia'].element.Buttons2.button1";
const BUTTON3 = "Network['4_Xtalk_Historia'].element.Buttons2.button2";
const BUTTON4 = "Network['4_Xtalk_Historia'].element.Buttons2.button4";
const LED1 = "Network['4_Xtalk_Historia'].element.Buttons.led1";
const LED2 = "Network['4_Xtalk_Historia'].element.Buttons2.led1";
const LED3 = "Network['4_Xtalk_Historia'].element.Buttons2.led2";
const LED4 = "Network['4_Xtalk_Historia'].element.Buttons2.led4";
const ROTARY1 = "Network['4_Xtalk_Historia'].element.Rotary1";
const ROTARY2 = "Network['4_Xtalk_Historia'].element.Rotary2";
const ROTARY3 = "Network['4_Xtalk_Historia'].element.Rotary3";
const ROTARY4 = "Network['4_Xtalk_Historia'].element.Rotary4";


export class SahkontuotantoController extends Script {
	private _event: string = '';
	private _currentGroup: number | null = null;

	private led1: PropertyAccessor<number>;
	private led2: PropertyAccessor<number>;
	private led3: PropertyAccessor<number>;
	private led4: PropertyAccessor<number>;

	@property('Event', true)
	public get event(): string {
		return this._event;
	}

	public constructor(env: ScriptEnv) {
		super(env);

		this.led1 = this.getProperty(LED1);
		this.led2 = this.getProperty(LED2);
		this.led3 = this.getProperty(LED3);
		this.led4 = this.getProperty(LED4);
		this.getProperty(BUTTON1, (value) => console.log(value));
		this.getProperty(BUTTON2, (value) => console.log(value));
		this.getProperty(BUTTON3, (value) => console.log(value));
		this.getProperty(BUTTON4, (value) => console.log(value));
		this.getProperty(ROTARY1, (value) => console.log(value));
		this.getProperty(ROTARY4, (value) => console.log(value));
	}
}
