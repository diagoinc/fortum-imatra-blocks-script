var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", "system_lib/Script", "system_lib/Metadata"], function (require, exports, Script_1, Metadata_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HistoriaController = void 0;
    var BUTTON1 = "Network['4_Xtalk_Historia'].element.Buttons.button1";
    var BUTTON2 = "Network['4_Xtalk_Historia'].element.Buttons2.button1";
    var BUTTON3 = "Network['4_Xtalk_Historia'].element.Buttons2.button2";
    var BUTTON4 = "Network['4_Xtalk_Historia'].element.Buttons2.button4";
    var LED1 = "Network['4_Xtalk_Historia'].element.Buttons.led1";
    var LED2 = "Network['4_Xtalk_Historia'].element.Buttons2.led1";
    var LED3 = "Network['4_Xtalk_Historia'].element.Buttons2.led2";
    var LED4 = "Network['4_Xtalk_Historia'].element.Buttons2.led4";
    var ROTARY1 = "Network['4_Xtalk_Historia'].element.Rotary1";
    var ROTARY2 = "Network['4_Xtalk_Historia'].element.Rotary2";
    var ROTARY3 = "Network['4_Xtalk_Historia'].element.Rotary3";
    var ROTARY4 = "Network['4_Xtalk_Historia'].element.Rotary4";
    var HistoriaController = (function (_super) {
        __extends(HistoriaController, _super);
        function HistoriaController(env) {
            var _this = _super.call(this, env) || this;
            _this._event = '';
            _this._currentGroup = null;
            _this.led1 = _this.getProperty(LED1);
            _this.led2 = _this.getProperty(LED2);
            _this.led3 = _this.getProperty(LED3);
            _this.led4 = _this.getProperty(LED4);
            _this.getProperty(BUTTON1, function (value) { return console.log(value); });
            _this.getProperty(BUTTON2, function (value) { return console.log(value); });
            _this.getProperty(BUTTON3, function (value) { return console.log(value); });
            _this.getProperty(BUTTON4, function (value) { return console.log(value); });
            _this.getProperty(ROTARY1, function (value) { return console.log(value); });
            _this.getProperty(ROTARY4, function (value) { return console.log(value); });
            return _this;
        }
        Object.defineProperty(HistoriaController.prototype, "event", {
            get: function () {
                return this._event;
            },
            enumerable: false,
            configurable: true
        });
        __decorate([
            (0, Metadata_1.property)('Event', true),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [])
        ], HistoriaController.prototype, "event", null);
        return HistoriaController;
    }(Script_1.Script));
    exports.HistoriaController = HistoriaController;
});
