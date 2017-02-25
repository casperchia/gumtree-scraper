/**
 * Created by Casper on 23/02/2017.
 */

"use strict";

const scrapeIt = require("scrape-it");
const jsonfile = require("jsonfile");
const nodemailer = require("nodemailer");
const CONFIG = require("./config");

const filePath = './data.json'
const searchQuery = CONFIG.searchQuery;
const url = `http://www.gumtree.com.au/s-${searchQuery}/k0`;
// http://www.gumtree.com.au/s-brazil+argentina/page-2/k0?fromSearchBox=true

var scrapeModel = {
   ads: {
      listItem: "#srchrslt-adtable > li",
      data: {
         id: {
            selector: ".ad-listing__watchlist.watchlist.j-watchlist",
            attr: "data-adid"
         },
         title: {
            selector: ".ad-listing__title",
         },
         price: {
            selector: ".ad-listing__price",
            convert: price => price || 'N/A'
         },
         url: {
            selector: ".ad-listing__watchlist.watchlist.j-watchlist",
            attr: "data-adid",
            convert: id => 'http://www.gumtree.com.au/s-ad/' + id
         }
      }
   }
}

console.log('Retrieving data...');
scrapeIt(url, scrapeModel, process);

function process(err, results) {
   var retrievedAds = toDictionary(results);
   try {
      var existingAds = jsonfile.readFileSync(filePath);
   } catch (err) {
      console.log(`Creating new file: ${filePath}`);
      jsonfile.writeFileSync(filePath, retrievedAds, {spaces: 2});
   }

   // Find which ads are new
   var newAds = {};
   for (var id in retrievedAds) {
      if (!(id in existingAds)) {
         newAds[id] = retrievedAds[id];
      }
      // Update the existing ads
      existingAds[id] = retrievedAds[id];
   }

   jsonfile.writeFileSync(filePath, existingAds, {spaces: 2});

   var newAdsCount = Object.keys(newAds).length;
   if (newAdsCount) {
      console.log(`${newAdsCount} new ads found`);
      sendMail(newAds);
   } else {
      console.log("No new ads found");
   }
}

function toDictionary(results) {
   var dict = {};

   if (!results || !results.ads) {
      return dict;
   }

   results.ads.forEach(function (ad) {
      if (ad.id) {
         dict[ad.id] = {
            title: ad.title,
            price: ad.price,
            url: ad.url
         }
      }
   })
   return dict;
}

function sendMail(ads) {
   console.log('Sending mail...');

   var adsCount = Object.keys(ads).length;
   var textContent = `${adsCount} new ad(s): \n`;
   var adsHtml = `<p>${adsCount} new ad(s):</p>\n`;
   for (var id in ads) {
      textContent = textContent.concat(`${ads[id].title} - ${ads[id].url}\n`);
      adsHtml = adsHtml.concat(`<p>${ads[id].price} - <a href="${ads[id].url}">${ads[id].title}</a></p>\n`);
   }

   var htmlContent = ''.concat("<html><head></head><body>", adsHtml, "</body></html>");

   var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: CONFIG.senderEmail,
         pass: CONFIG.senderPassword
      }
   });

   // setup email data with unicode symbols
   var mailOptions = {
      from: `"${CONFIG.senderName}" <${CONFIG.senderEmail}>`,
      to: CONFIG.recipients,
      subject: `New ${searchQuery} Ads`,
      text: textContent,
      html: htmlContent
   };

   // send mail with defined transport object
   transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
         return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
   });

}