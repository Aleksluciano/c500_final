"use strict";
var express = require("express");

module.exports = () => {
	var app = express.Router();

	//HANA DB Client 
	app.get("/", (req, res) => {
		let client = require("@sap/hana-client");
		//Lookup HANA DB Connection from Bound HDB Container Service
		const xsenv = require("@sap/xsenv");
		let hanaOptions = xsenv.getServices({
			hana: {
				"name": "CROSS_SCHEMA"
			}
		});
		console.log(hanaOptions.hana);
		//Create DB connection with options from the bound service
		let conn = client.createConnection();
		var connParams = {
			serverNode: hanaOptions.hana.host + ":" + hanaOptions.hana.port,
			uid: hanaOptions.hana.user,
			pwd: hanaOptions.hana.password
		};

		//connect
		conn.connect(connParams, (err) => {
			if (err) {
				return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
			} else {
				conn.exec(
					`select 
b."EMPRESA",
b."ESTABELECIMENTO"
 from "SAPABAP1"."/TMF/V_EMP_FED" as a JOIN "SAPABAP1"."/TMF/D_ESTABELEC" as b on a.EMPRESA = b.EMPRESA WHERE EH_MATRIZ = 'X'`,
					(err, result) => {
						if (err) {
							return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
						} else {

							let IdCompany = 0;
							let IdBranch = 0;
							let group = {
								CompanyCollection: [{
									Id: 0,
									Name: ""
								}],
								BranchCollection: [{
									Id: 0,
									Name: ""
								}]
							};
							let Company = "";

							result.forEach((a) => {
								if (a.EMPRESA !== Company) {
									IdCompany++;
									Company = a.EMPRESA;
									IdBranch = 0;
									group.CompanyCollection.push({
										Id: IdCompany,
										Name: a.EMPRESA
									});
								}
								IdBranch++;
								group.BranchCollection.push({
									IdCompany: IdCompany,
									Id: IdBranch,
									Name: a.ESTABELECIMENTO
								});

							});
							conn.disconnect();
							console.log(group);
							return res.type("application/json").status(200).send({
								emp: group.CompanyCollection,
								estab: group.BranchCollection
							});
						}
					});
			}
			return null;
		});
	});
	return app;
};