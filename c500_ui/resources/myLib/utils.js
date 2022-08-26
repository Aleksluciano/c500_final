"use strict";
sap.ui.define([], function () {
	"use strict";

	return {
		find: function (index, data) {
			for (var i = 0; i < data.length; i++) {
				if (data[i].Id == index) {
					return data[i].Name;
				}
			}
			return "";
		}
	};

});