"use strict";
var express = require("express");

function pad(n) {
	return n < 10 ? '0' + n : n;
}

module.exports = () => {
	var app = express.Router();

	//HANA DB Client 
	app.post("/", async(req, res) => {
		let client = require("@sap/hana-client");

		const xsenv = require("@sap/xsenv");
		let hanaOptions = xsenv.getServices({
			hana: {
				"name": "CROSS_SCHEMA"
			}
		});
		console.log(req.body);
		const {
			company,
			branch,
			branch2,
			period
		} = req.body;
		const period1 = period.slice(6) + period.slice(3, 5) + '01';
		const newdate = new Date(period.slice(6), Number(period.slice(3, 5)) + 1, 0);
		const period2 = newdate.getFullYear().toString() + pad((newdate.getMonth()).toString()) + newdate.getDate().toString();
		console.log(period1, period2);

		let conn = client.createConnection();
		var connParams = {
			serverNode: hanaOptions.hana.host + ":" + hanaOptions.hana.port,
			uid: hanaOptions.hana.user,
			pwd: hanaOptions.hana.password
		};

		//QUERIES
		const query1 = `select "MANDT_TFD" from "SAPABAP1"."/TMF/V_EMP_FED" WHERE EMPRESA = ? AND EH_MATRIZ = 'X'`;
		const query2 =
			`SELECT "MANDT", "NF_ID", "VL_FORN", "EMPRESA", "FILIAL", "COD_MOD", "DT_E_S", "VL_TOTAL_DOCUMENTO" FROM "SAPABAP1"."/TMF/V_NF_DOC" 
WHERE MANDT = ? AND EMPRESA = ? AND FILIAL BETWEEN ? AND ? AND COD_MOD = '6' AND DT_E_S BETWEEN ? AND ?`;
		const query3 = `select "MANDT", "NF_ID", "VL_FORN" from "SAPABAP1"."/TMF/D_NFDOC_CPL" WHERE MANDT = ? AND NF_ID = ?`;
		const query4 = `UPDATE "SAPABAP1"."/TMF/D_NFDOC_CPL" SET VL_FORN = ? WHERE MANDT = ? AND NF_ID = ?`;
		const query5 = `insert into "SAPABAP1"."/TMF/D_NFDOC_CPL"(MANDT, NF_ID, VL_FORN) values(?, ?, ?)`;
		const query6 =
			`SELECT "MANDT", "NF_ID", "VL_FORN", "DT_E_S", "VL_TOTAL_DOCUMENTO", "VL_FORN" FROM "SAPABAP1"."/TMF/D_NF_DOC" 
WHERE MANDT = ? AND NF_ID = ?`;
		const query7 = `UPDATE "SAPABAP1"."/TMF/D_NF_DOC" SET VL_FORN = ? WHERE MANDT = ? AND NF_ID = ?`;
		const resultAll = [];
		let item = 0;

	   //SQL EXEC
		try {
			await conn.connect(connParams);
			let v_emp_fed_table = await conn.exec(query1, [company]);
			let v_nf_doc_table = await conn.exec(query2, [v_emp_fed_table[0].MANDT_TFD, company, branch, branch2, period1, period2]);

			for (const v_nf_doc of v_nf_doc_table) {
				let d_nfdoc_cpl_table = await conn.exec(query3, [v_nf_doc.MANDT, v_nf_doc.NF_ID]);
				let d_nf_doc_table = await conn.exec(query6, [v_nf_doc.MANDT, v_nf_doc.NF_ID]);

				if (d_nf_doc_table.length > 0) {
					let d_nf_doc_updated = await conn.exec(query7, [v_nf_doc.VL_TOTAL_DOCUMENTO, v_nf_doc.MANDT, v_nf_doc.NF_ID]);
				}
				if (d_nfdoc_cpl_table.length > 0) {

					let d_nfdoc_cpl_updated = await conn.exec(query4, [v_nf_doc.VL_TOTAL_DOCUMENTO, v_nf_doc.MANDT, v_nf_doc.NF_ID]);
					if (d_nfdoc_cpl_updated == 1) {
						const update_d_nfdoc_cpl = {
							MANDT: v_nf_doc.MANDT,
							NF_ID: v_nf_doc.NF_ID,
							VL_FORN: v_nf_doc.VL_TOTAL_DOCUMENTO,
							VL_TOTAL_DOCUMENTO: v_nf_doc.VL_TOTAL_DOCUMENTO,
							DT_E_S: v_nf_doc.DT_E_S,
							EMPRESA: v_nf_doc.EMPRESA,
							FILIAL: v_nf_doc.FILIAL
						}
						item++;
						resultAll.push({...{item},...update_d_nfdoc_cpl});
					}
				} else {
					console.log("d_nfdoc_cpl_table > insert");
					let d_nfdoc_cpl_inserted = await conn.exec(query5, [v_nf_doc.MANDT, v_nf_doc.NF_ID, v_nf_doc.VL_TOTAL_DOCUMENTO]);
					if (d_nfdoc_cpl_inserted == 1) {
						const new_d_nfdoc_cpl = {
							MANDT: v_nf_doc.MANDT,
							NF_ID: v_nf_doc.NF_ID,
							VL_FORN: v_nf_doc.VL_TOTAL_DOCUMENTO,
							VL_TOTAL_DOCUMENTO: v_nf_doc.VL_TOTAL_DOCUMENTO,
							DT_E_S: v_nf_doc.DT_E_S,
							EMPRESA: v_nf_doc.EMPRESA,
							FILIAL: v_nf_doc.FILIAL
						}
						item++;
						resultAll.push({...{item},...new_d_nfdoc_cpl});
					}
				}
			}

			await conn.disconnect();

			return res.type("application/json").status(200).send({
				result: resultAll
			});

		} catch (err) {
			console.log(err)
			return res.type("text/plain").status(500).send(`ERROR: ${err.toString()}`);
		}

	}); 

	return app;
};