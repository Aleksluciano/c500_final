sap.ui.define(['sap/ui/core/UIComponent',
		'sap/ui/model/json/JSONModel',
		'App/myLib/oData'
	],
	function (UIComponent, JSONModel, oData) {
		"use strict";

		return UIComponent.extend("App.Component", {

			metadata: {
				manifest: "json"
			},

			init: function () {
				UIComponent.prototype.init.apply(this, arguments);
				
				
				var xhttp = new XMLHttpRequest();
				var view = this;
 
				xhttp.open("GET", "/data", true);
				xhttp.send();
				xhttp.onreadystatechange = function () {
					if (this.readyState === 4 && this.status === 200) {
						var response = JSON.parse(this.responseText);
						oData.CompanyCollection = response.emp;
						oData.Companies = response.emp;
						oData.BranchCollection = response.estab;
						oData.Branchs = response.estab;
						oData.BranchCollection2 = JSON.parse(JSON.stringify(response.estab));

						var oModel = new JSONModel(oData);
						view.setModel(oModel);

					}
				};

				var oModel = new JSONModel(oData);
				this.setModel(oModel);


			}

		});

	});