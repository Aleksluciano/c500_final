sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'App/myLib/oData',
	'App/myLib/utils',
	'sap/m/MessageToast',
	"sap/m/MessageBox"
], function (Controller, JSONModel, oData, utils, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("App.Page", {

		onPress: function () {
			var view = this.getView();
			if (oData.SelectedCompany == 0 || oData.SelectedBranch == 0 || oData.SelectedBranch2 == 0) {
				MessageBox.warning("Você deve preencher todos os campos de filtro!");
				return;
			}
			oData.Results = [];
			var oModel = new JSONModel(oData);
			view.setModel(oModel);

			var oDialog = this.byId("BusyDialog");
			oDialog.open();

			var company = utils.find(oData.SelectedCompany, oData.CompanyCollection);
			var branch = utils.find(oData.SelectedBranch, oData.BranchCollection);
			var branch2 = utils.find(oData.SelectedBranch2, oData.BranchCollection2);

			var xhttp = new XMLHttpRequest();
			xhttp.open("POST", "/change", true);
			xhttp.setRequestHeader('content-type', 'application/json');

			var content = {
				company: company,
				branch: branch,
				branch2: branch2,
				period: oData.SelectedPeriod
			};
			xhttp.send(JSON.stringify(content));
			var msg = '';
			xhttp.onreadystatechange = function () {
				if (this.readyState === 4 && this.status === 200) {
					var response = JSON.parse(this.responseText);
					oDialog.close();
					console.log(response.result);

					if (response.result.length > 0) {
						msg = 'Processado com sucesso!!';
					} else {
						msg = 'Nenhum registro encontrado';
					}

					oData.Results = response.result;
					var oModel = new JSONModel(oData);
					view.setModel(oModel);
					MessageToast.show(msg);
				} else {
					var msgError = 'Erro inesperado';
					MessageToast.show(msgError);
				}
			};

		},

		changeCompany: function () {
			var allData = this.getView().getModel().getData();

			oData.SelectedBranch = 0;
			oData.SelectedBranch2 = 0;
			oData.BranchCollection = [];
			oData.BranchCollection2 = [];

			oData.BranchCollection = allData.Branchs.filter(function (a) {
				if (a.IdCompany == oData.SelectedCompany || a.Id == 0) {
					return true;
				} else {
					return false;
				}
			});
			oData.BranchCollection2 = oData.BranchCollection;

		}

	});

});