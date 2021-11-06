require("dotenv").config();
const fs = require("fs");
const { Parser } = require("json2csv");
const axios = require("axios").default;

const final = process.env.SHOPIFY_URL;

const arr = [];

axios
	.get(final)
	.then(function (response) {
		// console.log(response.data.products);
		// console.log("variants of product 1: ", response.data.products[2].variants);
		response.data.products.forEach((product) => {
			if (product.variants.length > 0) {
				// iterate through variants
				product.variants.map((variant) => {
					const obj = {
						product_name: product.title,
						product_id: product.id,
						variant_name: variant.title,
						variant_id: variant.id,
					};
					arr.push(obj);
				});
			} else {
				// add product to productAndVariant
				arr.push([product.title, product.id]);
			}
		});
	})
	.catch(function (error) {
		console.log("error: ", error);
	})
	.then(function () {
		const json2csvParser = new Parser();
		const csv = json2csvParser.parse(arr);

		fs.writeFile("./productExport/products.csv", csv, (err) => {
			if (err) {
				console.error(err);
				return;
			}
			//file written successfully
		});
		console.log(
			"Product export has pulled ",
			arr.length,
			" entries. Check productExport directory."
		);
	});
