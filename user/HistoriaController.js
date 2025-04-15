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
    var ROTARY1 = "Network['4_Xtalk_Historia'].element.Rotary1.rotation";
    var ROTARY2 = "Network['4_Xtalk_Historia'].element.Rotary2.rotation";
    var ROTARY3 = "Network['4_Xtalk_Historia'].element.Rotary3.rotation";
    var ROTARY4 = "Network['4_Xtalk_Historia'].element.Rotary4.rotation";
    var NO_EVENT = '';
    var HistoriaController = (function (_super) {
        __extends(HistoriaController, _super);
        function HistoriaController(env) {
            var _this = _super.call(this, env) || this;
            _this._event = NO_EVENT;
            _this.currentGroup = null;
            _this.awaiter = undefined;
            _this.led1 = _this.getProperty(LED1);
            _this.led2 = _this.getProperty(LED2);
            _this.led3 = _this.getProperty(LED3);
            _this.led4 = _this.getProperty(LED4);
            _this.getProperty(BUTTON1, function (value) { return _this.handleButton(1, value); });
            _this.getProperty(BUTTON2, function (value) { return _this.handleButton(2, value); });
            _this.getProperty(BUTTON3, function (value) { return _this.handleButton(3, value); });
            _this.getProperty(BUTTON4, function (value) { return _this.handleButton(4, value); });
            _this.getProperty(ROTARY1, function (value) { return _this.handleRotation(1, value); });
            _this.getProperty(ROTARY2, function (value) { return _this.handleRotation(2, value); });
            _this.getProperty(ROTARY3, function (value) { return _this.handleRotation(3, value); });
            _this.getProperty(ROTARY4, function (value) { return _this.handleRotation(4, value); });
            return _this;
        }
        Object.defineProperty(HistoriaController.prototype, "event", {
            get: function () {
                return this._event;
            },
            enumerable: false,
            configurable: true
        });
        HistoriaController.prototype.restSetIdle = function (input) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return {};
        };
        HistoriaController.prototype.handleButton = function (group, value) {
            if (!value || this.currentGroup != group) {
                return;
            }
            this.triggerEvent('PLAY');
        };
        HistoriaController.prototype.handleRotation = function (group, value) {
            if (value == 0) {
                return;
            }
            console.log('rotate', group, value);
            if (this.currentGroup != group) {
                this.currentGroup = group;
                this.setLED(this.currentGroup);
            }
            this.triggerEvent("GO:".concat(group - 1, ":").concat(value));
        };
        HistoriaController.prototype.triggerEvent = function (event) {
            var _this = this;
            this._event = event;
            this.changed('event');
            if (this.awaiter) {
                this.awaiter.cancel();
            }
            this.awaiter = wait(100);
            this.awaiter.then(function () {
                _this._event = NO_EVENT;
                _this.awaiter = undefined;
            });
        };
        HistoriaController.prototype.setLED = function (ledNum) {
            this.led1.value = ledNum == 1 ? 3 : 0;
            this.led2.value = ledNum == 2 ? 3 : 0;
            this.led3.value = ledNum == 3 ? 3 : 0;
            this.led4.value = ledNum == 4 ? 3 : 0;
        };
        __decorate([
            (0, Metadata_1.property)('Event', true),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [])
        ], HistoriaController.prototype, "event", null);
        __decorate([
            (0, Metadata_1.resource)(undefined, 'GET'),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object]),
            __metadata("design:returntype", Object)
        ], HistoriaController.prototype, "restSetIdle", null);
        return HistoriaController;
    }(Script_1.Script));
    exports.HistoriaController = HistoriaController;
});
