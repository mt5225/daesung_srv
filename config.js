//global init settings
var cameraSignManager = {};
var leakSignManager = {};
var fireSignManager = {};
var RES_BASE = "http://localhost:8081/haesung_res/";
var API_BASE = "http://localhost:9006/";
var LISTENING = false;
var T_Live_Fire_Alarm = {};
var T_Live_Gas_Alarm = {};
var T_FireObj_List = {};
var T_GasObj_List = {};
var objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
var patrolPath = [];
var PATROL_STAY_TIME = 10000;
var PATROL_TOTAL_TIME = 100000;
var PATROL_TOTAL_COUNT = Math.Floor(PATROL_TOTAL_TIME / PATROL_STAY_TIME) - 1;

function open_camera_live_feed(camObj) {
	if (camObj != null) {
		util.setTimeout(function () {
			selector.select(camObj);
			util.externalEval("layer.closeAll();layer.open({type:2,title:'" + camObj.uid + "',offset:'r',anim:-1,isOutAnim:false,resize:false,shade:0,area:['340px','300px'],content:'" + RES_BASE + camObj.uid + ".html'});");
		}, 500);
	}
}

function fly_indoor(building_id, floor_id) {
	var building = world.buildingList.get_Item(building_id);
	util.setTimeout(function () {
		level.change(building);
		util.setTimeout(function () {
			var floor = building.planList.get_Item(floor_id);
			level.change(floor);
		}, 500);
	}, 100);
}

function fly_sensor_outdoor(sensorObj) {
	var pos = sensorObj.pos;
	CURRENT_LEVEL = 'world';
	level.change(world);
	util.setTimeout(function () {
		camera.flyTo({
			"eye": Vector3(pos.x + 5, pos.y + 5, pos.z + 5),
			"target": pos,
			"time": 1
		});
	}, 1000)

}

function fly_outdoor() {
	camera.flyTo({
		"eye": Vector3(-80, 80, -50),
		"target": Vector3(3, 4, 5),
		"time": 1,
		"complete": function () {
			CURRENT_LEVEL = 'world';
			level.change(world);
		}
	});
}

var _patrol_index = 0;
var _patrol_timer = null;
var _on_patrol = false;
var _patrol_sign = null;
var _patrol_count = 0;
function patrol() {
	_on_patrol = !_on_patrol;
	if (_on_patrol) {
		util.clearInterval(_patrol_timer);
		_patrol_sign = gui.createLabel("<color=green>PATROL</color>", Rect(5, 60, 120, 30));
		_patrol_timer = util.setInterval(function () {
				if (_patrol_count >= PATROL_TOTAL_COUNT) {
					stop_patrol();
				} else {
					if (_patrol_index > array.count(patrolPath) - 1)
						_patrol_index = 0;
					var camObj = object.find(patrolPath[_patrol_index]);
					if (camObj != null) {
						var pos = camObj.pos;
						camera.flyTo({
							"eye": Vector3(pos.x + 5, pos.y + 5, pos.z + 5),
							"target": pos,
							"time": 2.0
						})
						open_camera_live_feed(camObj);
					}
					_patrol_index++;
					_patrol_count++;
				}

			}, PATROL_STAY_TIME)
	} else {
		gui.destroy(_patrol_sign);
		util.clearInterval(_patrol_timer);
	}
}

function stop_patrol() {
	if (_patrol_sign != null) {
		gui.destroy(_patrol_sign);
	}
	util.clearInterval(_patrol_timer);
	_on_patrol = false;
	_patrol_index = 0;
	_patrol_count = 0;
}

function init() {
	//init sign
	for (var i = 1; i < 99; i++) {
		if (i < 10) {
			camName = 'C0' + i;
			signText = 'C0' + i;
		} else {
			camName = 'C' + i;
			signText = 'C' + i;
		}
		var obj = object.find(camName);
		if (obj != null) {
			cameraSignManager[obj] = signText;
			if (obj.isOpen()) {
				obj.open(false);
			} else {
				obj.open(true);
			}
		}
	}

	//create banner
	util.download({
		"url": RES_BASE + "balloon_button.bundle",
		"success": function (res) {
			foreach(var item in pairs(cameraSignManager)) {
				var camera_ui = gui.create(res);
				var camObj = item.key;
				var offsetY = camObj.size.y;
				camera_ui.setObject(camObj, Vector3(0, offsetY, 0));
				camera_ui.setScale(0.25, 0.25);
				camera_ui.setText("Button/Text", cameraSignManager[camObj]);
				camera_ui.regButtonEvent("Button", function () {
					open_camera_live_feed(camObj);
				});
			}
		}
	});
}

function sensorinit() {
	//init sign
	for (var i = 1; i < 99; i++) {
		if (i < 10) {
			fireSensorName = 'F0' + i;
			leakSensorName = 'L0' + i;
		} else {
			fireSensorName = 'F' + i;
			leakSensorName = 'L' + i;
		}
		var obj = object.find(fireSensorName);

		if (obj != null) {
			fireSignManager[obj] = fireSensorName;
		}
		obj = object.find(leakSensorName);
		if (obj != null) {
			leakSignManager[obj] = leakSensorName;
		}
	}

	//create banner
	util.download({
		"url": RES_BASE + "outline_button.bundle",
		"success": function (res) {
			foreach(var item in pairs(fireSignManager)) {
				var banner_ui = gui.create(res);
				var camObj = item.key;
				camObj.setTransparent(0.001);
				camObj.setColor(Color.blue);
				var bound = ObjectUtil.CalculateBounds(camObj.gameObject);
				var offsetY = 0.5;
				banner_ui.setScale(0.6, 0.6);
				banner_ui.setObject(camObj, Vector3(0, offsetY, 0));
				banner_ui.setText("Button/Text", item.value);
				util.downloadTexture({
					"url": RES_BASE + "demo_panel_001.png",
					"success": function (t) {
						banner_ui.setImage("Button", t);
					}
				});
			};
			foreach(var item in pairs(leakSignManager)) {
				var banner_ui = gui.create(res);
				var camObj = item.key;
				camObj.setTransparent(0.001);
				camObj.setColor(Color.blue);
				var bound = ObjectUtil.CalculateBounds(camObj.gameObject);
				var offsetY = 0.5;
				banner_ui.setScale(0.6, 0.6);
				banner_ui.setObject(camObj, Vector3(0, offsetY, 0));
				banner_ui.setText("Button/Text", item.value);
				util.downloadTexture({
					"url": RES_BASE + "demo_panel_002.png",
					"success": function (t) {
						banner_ui.setImage("Button", t);
					}
				});
			}
		}
	});
}

init();
sensorinit();

//fly to  sensor level
function fly_to_sensor_level(sensorObj, msgString) {
	if (msgString != '') {
		tmpArray = string.split(msgString, "|");
		if (tmpArray[4] == 'Campus') {
			fly_sensor_outdoor(sensorObj);
		} else {
			var building_id = -1; // fly to campus
			if (tmpArray[4] == '101') {
				building_id = 0
			}
			if (tmpArray[4] == '103') {
				building_id = 1
			}
			if (tmpArray[4] == '105A') {
				building_id = 2
			}
			if (tmpArray[4] == '105B') {
				building_id = 3
			}
			if (tmpArray[4] == '106') {
				building_id = 4
			}
			if (tmpArray[4] == '107') {
				building_id = 5
			}
			if (tmpArray[4] == '109') {
				building_id = 6
			}
			if (tmpArray[4] == '111') {
				building_id = 7
			}
			if (tmpArray[4] == '117') {
				building_id = 8
			}
			if (tmpArray[4] == '201') {
				building_id = 9
			}
			if (tmpArray[4] == '202') {
				building_id = 10
			}
			if (tmpArray[4] == '203') {
				building_id = 11
			}
			if (tmpArray[4] == '204') {
				building_id = 12
			}
			if (tmpArray[4] == '303') {
				building_id = 13
			}
			if (tmpArray[4] == '304') {
				building_id = 14
			}
			if (tmpArray[4] == '401402') {
				building_id = 15
			}
			var floor_id = 0;
			if (tmpArray[5] == '0') {
				floor_id = 0
			}
			if (tmpArray[5] == '1') {
				floor_id = 1
			}
			if (tmpArray[5] == '2') {
				floor_id = 2
			}
			if (tmpArray[5] == '3') {
				floor_id = 3
			}
			fly_indoor(building_id, floor_id);

		}

	}
}

function show_fire(sensorObj, camObj) {
	if (T_FireObj_List[sensorObj] == null) {
		stop_patrol();
		fly_to_sensor_level(sensorObj, T_Live_Fire_Alarm[sensorObj.uid]);
		util.setTimeout(function () {
			var fireEffectObject = object.create("4483E64D87BA49F8AA9AAA693194A541");
			fireEffectObject.setPosition(sensorObj.center);
			T_FireObj_List[sensorObj] = fireEffectObject;
			open_camera_live_feed(camObj);
		}, 2000);

	}
}

function show_gas(sensorObj, camObj) {
	if (T_GasObj_List[sensorObj] == null) {
		stop_patrol();
		fly_to_sensor_level(sensorObj, T_Live_Gas_Alarm[sensorObj.uid]);
		util.setTimeout(function () {
			var gasEffectObject = object.create("4C818E5DF22C429FA73B47F88DBCD7BA");
			gasEffectObject.setPosition(sensorObj.center);
			T_GasObj_List[sensorObj] = gasEffectObject;
			open_camera_live_feed(camObj);
		}, 2000);
	}
}

function remove_recovery_fire_alarm(item) {
	if (table.containskey(T_FireObj_List, item)) {
		if (T_FireObj_List[item] != null) {
			fly_to_sensor_level(item, T_Live_Fire_Alarm[item.uid]);
			T_FireObj_List[item].destroy();
		}
		table.remove(T_FireObj_List, item);
	}
}

function remove_recovery_gas_alarm(item) {
	if (table.containskey(T_GasObj_List, item)) {
		if (T_GasObj_List[item] != null) {
			fly_to_sensor_level(item, T_Live_Gas_Alarm[item.uid]);
			T_GasObj_List[item].destroy();
		}
		table.remove(T_GasObj_List, item);
	}
}

function update_fire_alarm_table() {
	foreach(var item in vpairs(table.keys(T_Live_Fire_Alarm))) {
		var tmpArray = string.split(T_Live_Fire_Alarm[item], "|");
		var sensor_status = tmpArray[1];
		var fireObj = object.find(item);
		var camObj = object.find(tmpArray[3])
			if (fireObj != null && camObj != null) {
				if (sensor_status == "fire_alarm") {
					util.setTimeout(function () {
						show_fire(fireObj, camObj);
					}, 500);
				} else {
					remove_recovery_fire_alarm(fireObj);

				}
			}
	}
}

function update_gas_alarm_table() {
	foreach(var item in vpairs(table.keys(T_Live_Gas_Alarm))) {
		var tmpArray = string.split(T_Live_Gas_Alarm[item], "|");
		var sensor_status = tmpArray[1];
		var gasObj = object.find(item);
		var camObj = object.find(tmpArray[3])
			if (gasObj != null && camObj != null) {
				if (sensor_status == "gas_alarm") {
					util.setTimeout(function () { ;
						show_gas(gasObj, camObj);
					}, 500);
				} else {
					remove_recovery_gas_alarm(gasObj);
				}
			}
	}
}

function remove_all_fire_alarm() {
	foreach(var item in vpairs(table.keys(T_FireObj_List))) {
		if (T_FireObj_List[item] != null) {
			T_FireObj_List[item].destroy();
		}
	}
}

function remove_all_gas_alarm() {
	foreach(var item in vpairs(table.keys(T_GasObj_List))) {
		if (T_GasObj_List[item] != null) {
			T_GasObj_List[item].destroy();
		}
	}
}
//create UI button with actions
gui.createButton("Listen", Rect(40, 220, 60, 30), function () {
	if (LISTENING == false) {
		gui.destroy(objSign);
		objSign = gui.createLabel("<color=green>LISTENING</color>", Rect(5, 38, 120, 30));
		LISTENING = true;
		util.setInterval(function () {
			if (LISTENING) {
				//polling for fire information

				util.download({
					"url": API_BASE + "alarms",
					"type": "text",
					"success": function (rs) {
						if (string.length(rs) > 10) {
							rs = string.trim(rs);
							//  messages array separated by #
							var msgArray = string.split(rs, "#");
							for (var i = 0; i < array.count(msgArray); i++) {
								//split and save to live event table
								tmpArray = string.split(msgArray[i], "|");
								if (tmpArray[1] == 'fire_alarm' || tmpArray[1] == 'fire_recover') {
									T_Live_Fire_Alarm[tmpArray[2]] = msgArray[i];
								} else {
									T_Live_Gas_Alarm[tmpArray[2]] = msgArray[i];
								}
							}
							update_fire_alarm_table();
							update_gas_alarm_table();

						} else {
							remove_all_fire_alarm();
							remove_all_gas_alarm();
						}

					},
					"error": function (t) {
						print(t);
					}
				});
			}
		},
			3000);
	}
});

gui.createButton("Reset", Rect(40, 260, 60, 30), function () {
	util.clearAllTimers();
	util.setTimeout(function () {
		remove_all_fire_alarm();
		remove_all_gas_alarm();
		stop_patrol();
		util.externalEval("layer.closeAll();");
		table.clear(T_FireObj_List);
		table.clear(T_GasObj_List);
		table.clear(T_Live_Fire_Alarm);
		table.clear(T_Live_Gas_Alarm);
	}, 500);
	gui.destroy(objSign);
	objSign = gui.createLabel("<color=red>IDLE</color>", Rect(5, 38, 120, 30));
	fly_outdoor();
	LISTENING = false;
});

gui.createButton("Patrol", Rect(40, 300, 60, 30), function () {
	_patrol_index = 0;
	util.download({
		"url": API_BASE + "path",
		"type": "text",
		"success": function (rs) {
			if (string.length(rs) > 3) {
				rs = string.trim(rs);
				patrolPath = string.split(rs, "#");
				patrol();
			}
		},
		"error": function (t) {
			print(t);
		}
	});

});

var patrolLine = null;

gui.createToggle(false, "Path", Rect(40, 340, 60, 30), function (toggle) {
	if (toggle) {
		_patrol_index = 0;
		util.download({
			"url": API_BASE + "path",
			"type": "text",
			"success": function (rs) {
				if (string.length(rs) > 3) {
					rs = string.trim(rs);
					patrolPath = string.split(rs, "#");
					var camPoints = Vector3List();
					for (var i = 0; i < array.count(patrolPath); i++) {
						var camObj = object.find(patrolPath[i]);
						if (camObj != null) {
							camPoints.Add(Vector3(camObj.pos.x, camObj.pos.y + 0.1, camObj.pos.z));
						}
					}
					if (patrolLine != null) {
						patrolLine.destroy();
					} else {
						patrolLine = object.createArrowLine(camPoints, {
								"color": Color.blue,
								"arrowColor": Color.blue
							});
					}
				}
			},
			"error": function (t) {
				print(t);
			}
		});
	} else {
		if (patrolLine != null)
			patrolLine.destroy();
	}

});

//download floor name bundle
ui_floorName = null;
util.download({
	"url": RES_BASE + "floorname_pc.bundle",
	"success": function (res) {
		ui_floorName = gui.create(res);
		ui_floorName.show(false);
	}
});

util.addEventListener("click", function (e) {
	if (FloorPlan.current != null && FloorPlan.current.name != "" && FloorPlan.current.name != "FloorPlan") {
		ui_floorName.show(true);
		ui_floorName.setText("Image/Text", FloorPlan.current.name);
	} else {
		ui_floorName.show(false);
	}
})
