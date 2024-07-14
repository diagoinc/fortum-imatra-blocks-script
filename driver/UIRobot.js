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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
define(["require", "exports", "system_lib/Driver", "system_lib/Metadata"], function (require, exports, Driver_1, Metadata_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UIRobot = void 0;
    var UIRobot = exports.UIRobot = (function (_super) {
        __extends(UIRobot, _super);
        function UIRobot(socket, bufferSize) {
            var _this = _super.call(this, socket) || this;
            _this.socket = socket;
            _this.mLeftDown = false;
            _this.mRightDown = false;
            _this.mPower = false;
            _this.mProgramParams = '';
            _this.mCurrentKeys = '';
            if (bufferSize)
                socket.setMaxLineLength(bufferSize);
            socket.enableWakeOnLAN();
            socket.autoConnect();
            socket.subscribe('connect', function (sender, message) {
                if (message.type === 'Connection')
                    _this.onConnectStateChanged(sender.connected);
            });
            if (socket.connected)
                _this.onConnectStateChanged(true);
            return _this;
        }
        UIRobot_1 = UIRobot;
        UIRobot.prototype.onConnectStateChanged = function (connected) {
            if (connected)
                this.power = true;
            else
                this.mProgramParams = '';
        };
        Object.defineProperty(UIRobot.prototype, "power", {
            get: function () {
                return this.mPower;
            },
            set: function (power) {
                if (this.mPower !== power) {
                    this.mPower = power;
                    this.cancelWoLRetry();
                    if (power) {
                        if (this.program === UIRobot_1.kPowerDownProgram)
                            this.program = '';
                        this.woLRetryAttempts = 0;
                        this.tryWakeUp();
                    }
                    else
                        this.program = UIRobot_1.kPowerDownProgram;
                }
            },
            enumerable: false,
            configurable: true
        });
        UIRobot.prototype.tryWakeUp = function () {
            var _this = this;
            if (!this.socket.connected) {
                if (this.woLRetryAttempts < UIRobot_1.kWoLRetryMaxAttempts) {
                    this.socket.wakeOnLAN();
                    this.woLRetryPromise = wait(UIRobot_1.kWoLRetryInterval);
                    this.woLRetryPromise.then(function () { return _this.tryWakeUp(); });
                    this.woLRetryAttempts += 1;
                }
                else {
                    this.woLRetryPromise = undefined;
                    this.power = false;
                }
            }
            else
                this.woLRetryPromise = undefined;
        };
        UIRobot.prototype.cancelWoLRetry = function () {
            if (this.woLRetryPromise) {
                this.woLRetryPromise.cancel();
                this.woLRetryPromise = undefined;
            }
        };
        Object.defineProperty(UIRobot.prototype, "leftDown", {
            get: function () {
                return this.mLeftDown;
            },
            set: function (value) {
                if (this.mLeftDown !== value) {
                    this.mLeftDown = value;
                    this.sendMouseButtonState(1024, value);
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(UIRobot.prototype, "rightDown", {
            get: function () {
                return this.mRightDown;
            },
            set: function (value) {
                if (this.mRightDown !== value) {
                    this.mRightDown = value;
                    this.sendMouseButtonState(4096, value);
                }
            },
            enumerable: false,
            configurable: true
        });
        UIRobot.prototype.moveMouse = function (x, y) {
            this.sendCommand('MouseMove', x, y);
        };
        UIRobot.prototype.transitoryCommand = function (exePath, workingDirectory, args) {
            var params = [];
            if (args)
                params = args.split('|');
            params.unshift(exePath);
            params.unshift(workingDirectory);
            return this.sendCommand.apply(this, __spreadArray(['Launch'], params, false));
        };
        Object.defineProperty(UIRobot.prototype, "program", {
            get: function () {
                return this.mProgramParams;
            },
            set: function (programParams) {
                if (this.mProgramParams !== programParams) {
                    var runningProgram = this.parseProgramParams(this.mProgramParams);
                    if (runningProgram) {
                        this.sendCommand('Terminate', runningProgram.program);
                    }
                    var newProgram = this.parseProgramParams(programParams);
                    if (newProgram) {
                        this.mProgramParams = programParams;
                        this.sendCommand.apply(this, __spreadArray(['Launch',
                            newProgram.workingDir,
                            newProgram.program], newProgram.arguments, false));
                    }
                    else {
                        this.mProgramParams = '';
                    }
                }
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(UIRobot.prototype, "keyDown", {
            get: function () {
                return this.mCurrentKeys;
            },
            set: function (keys) {
                var _this = this;
                this.mCurrentKeys = keys;
                if (!!this.mCurrentKeys) {
                    var keyPresses = keys.split('+');
                    var key = keyPresses[keyPresses.length - 1];
                    var modifierSum_1 = 0;
                    if (keyPresses.length > 1) {
                        var modifiers = keyPresses.slice(0, keyPresses.length - 1);
                        var modifierValues_1 = {
                            'shift': 1,
                            'control': 2,
                            'alt': 4,
                            'altgr': 8,
                            'meta': 16
                        };
                        modifiers.forEach(function (mod) { return modifierSum_1 += modifierValues_1[mod] || 0; });
                    }
                    this.sendCommand('KeyPress', key, modifierSum_1);
                    if (this.mKeyRlsTimer)
                        this.mKeyRlsTimer.cancel();
                    this.mKeyRlsTimer = wait(200);
                    this.mKeyRlsTimer.then(function () {
                        _this.keyDown = '';
                        _this.mKeyRlsTimer = undefined;
                    });
                }
            },
            enumerable: false,
            configurable: true
        });
        UIRobot.prototype.sendMouseButtonState = function (buttonMask, down) {
            this.sendCommand('MousePress', buttonMask, down ? 1 : 2);
        };
        UIRobot.prototype.sendCommand = function (command) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            command += ' ' + args.join(' ');
            return this.socket.sendText(command);
        };
        UIRobot.prototype.parseProgramParams = function (programParams) {
            if (programParams) {
                var params = programParams.split('|');
                var result = {
                    program: UIRobot_1.quote(params[0]),
                    workingDir: UIRobot_1.quote(params[1]) || '/',
                    arguments: params.slice(2)
                };
                return result;
            }
        };
        UIRobot.quote = function (str) {
            return '"' + str + '"';
        };
        var UIRobot_1;
        UIRobot.kPowerDownProgram = "C:/Windows/System32/shutdown.exe||/s /f /t 0";
        UIRobot.kWoLRetryInterval = 1000 * 20;
        UIRobot.kWoLRetryMaxAttempts = 10;
        __decorate([
            (0, Metadata_1.property)("Power computer on/off"),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], UIRobot.prototype, "power", null);
        __decorate([
            (0, Metadata_1.property)("Left mouse button down"),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], UIRobot.prototype, "leftDown", null);
        __decorate([
            (0, Metadata_1.property)("Right mouse button down"),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [Boolean])
        ], UIRobot.prototype, "rightDown", null);
        __decorate([
            (0, Metadata_1.callable)("Move mouse by specified distance"),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Number, Number]),
            __metadata("design:returntype", void 0)
        ], UIRobot.prototype, "moveMouse", null);
        __decorate([
            (0, Metadata_1.callable)("Transitory command to run"),
            __param(0, (0, Metadata_1.parameter)("Path to executable command to run")),
            __param(1, (0, Metadata_1.parameter)("Working directory to be applied")),
            __param(2, (0, Metadata_1.parameter)("Additional arguments, separated by vertical bar", true)),
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [String, String, String]),
            __metadata("design:returntype", void 0)
        ], UIRobot.prototype, "transitoryCommand", null);
        __decorate([
            (0, Metadata_1.property)("The program to start, will end any previously running program. Format is EXE_PATH|WORKING_DIR|...ARGS"),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [String])
        ], UIRobot.prototype, "program", null);
        __decorate([
            (0, Metadata_1.property)("Send key strokes, modifiers before key"),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [String])
        ], UIRobot.prototype, "keyDown", null);
        UIRobot = UIRobot_1 = __decorate([
            (0, Metadata_1.driver)('NetworkTCP', { port: 3047 }),
            __metadata("design:paramtypes", [Object, Number])
        ], UIRobot);
        return UIRobot;
    }(Driver_1.Driver));
});
