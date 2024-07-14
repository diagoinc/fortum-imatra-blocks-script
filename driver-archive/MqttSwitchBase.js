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
define(["require", "exports", "system_lib/Driver", "system_lib/Metadata"], function (require, exports, Driver_1, Metadata_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputBase = exports.OutputBase = exports.MqttSwitchBase = void 0;
    var MqttSwitchBase = exports.MqttSwitchBase = (function (_super) {
        __extends(MqttSwitchBase, _super);
        function MqttSwitchBase(mqtt) {
            var _this = _super.call(this, mqtt) || this;
            _this.mqtt = mqtt;
            _this.mConnected = false;
            _this.mOnline = false;
            return _this;
        }
        MqttSwitchBase.prototype.initialize = function () {
            var _this = this;
            var kMaxIOCount = 32;
            var outputCount = 4;
            var inputCount = 4;
            var rawOptions = this.mqtt.options;
            if (rawOptions) {
                var options = JSON.parse(rawOptions);
                outputCount = Math.max(0, Math.min(kMaxIOCount, options.outputs || 0));
                inputCount = Math.max(0, Math.min(kMaxIOCount, options.inputs || 0));
            }
            for (var rix = 0; rix < outputCount; ++rix)
                this.output.push(this.makeOutput(rix));
            for (var six = 0; six < inputCount; ++six)
                this.input.push(this.makeInput(six));
            this.mqtt.subscribeTopic("online", function (sender, message) {
                _this.setOnline(message.text === 'true');
            });
        };
        Object.defineProperty(MqttSwitchBase.prototype, "connected", {
            get: function () {
                return this.mConnected;
            },
            set: function (value) {
                this.mConnected = value;
            },
            enumerable: false,
            configurable: true
        });
        MqttSwitchBase.prototype.setOnline = function (online) {
            if (this.mOnline !== online) {
                this.mOnline = online;
                this.updateConnected();
            }
        };
        MqttSwitchBase.prototype.updateConnected = function () {
            this.connected = this.mOnline && this.mqtt.connected;
        };
        __decorate([
            (0, Metadata_1.property)("Connected to broker and device online", true),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], MqttSwitchBase.prototype, "connected", null);
        return MqttSwitchBase;
    }(Driver_1.Driver));
    var OutputBase = exports.OutputBase = (function () {
        function OutputBase(owner, index) {
            this.owner = owner;
            this.index = index;
            this.active = false;
            this.inFeedback = false;
        }
        OutputBase.prototype.init = function () {
            var _this = this;
            this.owner.mqtt.subscribeTopic(this.feedbackTopic(), function (sender, message) {
                _this.owner.setOnline(true);
                var newState = _this.parseFeedback(message.text);
                _this.inFeedback = true;
                _this.on = newState;
                _this.inFeedback = false;
            });
        };
        Object.defineProperty(OutputBase.prototype, "on", {
            get: function () {
                return this.active;
            },
            set: function (value) {
                this.active = value;
                if (!this.inFeedback)
                    this.sendCommand(value);
            },
            enumerable: false,
            configurable: true
        });
        __decorate([
            (0, Metadata_1.property)("True if output is active"),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], OutputBase.prototype, "on", null);
        return OutputBase;
    }());
    var InputBase = exports.InputBase = (function () {
        function InputBase(owner, index) {
            this.owner = owner;
            this.index = index;
            this.mActive = false;
        }
        InputBase.prototype.init = function () {
            var _this = this;
            this.owner.mqtt.subscribeTopic(this.feedbackTopic(), function (sender, message) {
                _this.owner.setOnline(true);
                _this.active = _this.parseFeedback(message.text);
            });
        };
        Object.defineProperty(InputBase.prototype, "active", {
            get: function () {
                return this.mActive;
            },
            set: function (value) {
                this.mActive = value;
            },
            enumerable: false,
            configurable: true
        });
        __decorate([
            (0, Metadata_1.property)("True if input switch is closed", true),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], InputBase.prototype, "active", null);
        return InputBase;
    }());
});
