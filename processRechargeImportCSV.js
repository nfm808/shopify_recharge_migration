require("dotenv").config();
const fs = require("fs");
const csvJson = require("csvtojson");
const { Parser } = require("json2csv");

// paths to csv to work with
const rechargeImportFilePath =
	"./rechargeTemplate/Recharge-migration-Malama-Mushrooms.csv";
const shopifyProductsFilePath = "./productExport/products.csv";

async function processRechargeCSV() {
	console.log("processRecharge started");

	// Convert a recharge import csv to json
	let rechargeJson = await csvJson()
		.fromFile(rechargeImportFilePath)
		.then(function (jsonArrayObj) {
			//when parse finished, result will be emitted here.
			// console.log(jsonArrayObj);
			return jsonArrayObj;
		});

	// convert exported shopify products csv to json
	let productsJson = await csvJson()
		.fromFile(shopifyProductsFilePath)
		.then((jsonArrayObj) => {
			// console.log(jsonArrayObj);
			return jsonArrayObj;
		});

	// loop through the rechargeJson to process data and add id
	for (obj in rechargeJson) {
		let customer = rechargeJson[obj];
		let {
			external_product_name,
			external_variant_name,
			external_product_id,
			external_variant_id,
		} = customer;

		// normalize the data to oz instead of oz.
		if (external_variant_name[external_variant_name.length - 1] === ".") {
			external_variant_name = external_variant_name.slice(
				0,
				external_variant_name.length - 1
			);
			rechargeJson[obj].external_variant_name =
				external_variant_name.toLowerCase();
		}
		// normalize data with space after .
		if (external_variant_name[external_variant_name.length - 1] === ". ") {
			external_variant_name = external_variant_name.slice(
				0,
				external_variant_name.length - 2
			);
			rechargeJson[obj].external_variant_name =
				external_variant_name.toLowerCase();
		}
		// clean up the 100G) entry to 3.5 oz
		if (external_variant_name[external_variant_name.length - 1] === ")") {
			external_variant_name = external_variant_name.slice(
				0,
				external_variant_name.length - 8
			);
			// check to ensure there is no oz. and clean it to oz
			if (external_variant_name[external_variant_name.length - 1] === ".") {
				external_variant_name = external_variant_name.slice(
					0,
					external_variant_name.length - 1
				);
			}
			rechargeJson[obj].external_variant_name =
				external_variant_name.toLowerCase();
		}
		// fix this edge case of no space between 3.5oz
		if (external_variant_name === "3.5oz") {
			external_variant_name = "3.5 oz";
			rechargeJson[obj].external_variant_name = external_variant_name;
		}
		// adjust naming convention to reflect current naming of products
		// from 1 lb to 16 oz
		if (external_variant_name === "1 lb") {
			external_variant_name = "16 oz";
			rechargeJson[obj].external_variant_name = external_variant_name;
		}
		// was an edge case that needed blanking
		if (external_variant_name === "Default Title") {
			external_variant_name = "";
			rechargeJson[obj].external_variant_name = external_variant_name;
		}

		// loop throught the product list
		for (x in productsJson) {
			let product = productsJson[x];
			let { product_name, product_id, variant_name, variant_id } = product;

			// check customer name and variant names to replace product
			// and variant ids to the rechargeJson object
			if (
				external_product_name.toLowerCase() === product_name.toLowerCase() &&
				external_variant_name.toLowerCase() === variant_name.toLowerCase()
			) {
				rechargeJson[obj].external_product_id = product_id;
				rechargeJson[obj].external_variant_id = variant_id;
			} else if (
				external_product_name === product_name &&
				external_variant_name === ""
			) {
				rechargeJson[obj].external_product_id = product_id;
				rechargeJson[obj].external_variant_id = variant_id;
			}
		}
	}
	// reformat the data to csv and write to file in finalExport dir
	const json2csvParser = new Parser();
	const csv = json2csvParser.parse(rechargeJson);
	fs.writeFile("./finalExport/processed.csv", csv, (err) => {
		if (err) {
			console.log(err);
		}
	});
	console.log("process Recharge completed. Check finalExport directory.");
}

processRechargeCSV();
