const { spawn } = require("child_process");
const fs = require("fs");

const { send, json } = require("micro");
const JSONStream = require("JSONStream");
const es = require("event-stream");
const algoliasearch = require("algoliasearch");

const config = {
  algolia: {
    appID: process.env.ALGOLIA_APPID,
    adminKey: process.env.ALGOLIA_ADMIN_KEY,
    index: process.env.ALGOLIA_INDEX
  },
  instaScraper: {
    targetAccount: process.env.TARGET_ACCOUNT,
    userAccount: process.env.USER_ACCOUNT,
    passAccount: process.env.PASS_ACCOUNT
  },
  urlToHit: process.env.URL_TO_HIT || "/",
  methodToHit: process.env.METHOD_TO_HIT || "POST"
};

const client = algoliasearch(config.algolia.appID, config.algolia.adminKey);

module.exports = async (req, res) => {
  if (req.method !== config.methodToHit || req.url !== config.urlToHit) {
    return send(res, 400, "Unexpected ask!");
  }
  const configFromBody = await json(req);
  const index = client.initIndex(configFromBody.index || config.algolia.index);
  const targetAccount =
    configFromBody.targetAccount || config.instaScraper.targetAccount;
  const child = spawn("instagram-scraper", [
    targetAccount,
    "-u",
    config.instaScraper.userAccount,
    "-p",
    config.instaScraper.passAccount,
    "--media-metadata",
    "-t",
    "none",
    "--include-location"
  ]);

  child.on("exit", (_, signal) => {
    if (signal !== null) {
      return send(res, 400, { message: "error", reason: signal });
    }
    // everything went good during the scraping of instagram data :)
    const stream = fs.createReadStream(
      `./${targetAccount}/${targetAccount}.json`,
      {
        encoding: "utf8"
      }
    );
    const postIdFromSource = [];
    const postIdFromAlgolia = [];
    const browser = index.browseAll();

    // get the records in case of deleted instagram post that already store in algolia
    browser.on("result", content =>
      postIdFromAlgolia.push(...content.hits.map(entry => entry.objectID))
    );
    browser.on("end", () => {
      console.warn("Finishing get record from algolia...");
      // get the json by stream inside the file above
      stream.pipe(JSONStream.parse("*")).pipe(
        es.through(
          function write(data) {
            this.pause();
            console.warn("trying to insert object in algolia... ", data.id);
            // get all objectID of the current scrap
            postIdFromSource.push(data.id);
            const wantedData = {
              objectID: data.id,
              display_url: data.display_url,
              likes: data.edge_media_preview_like.count,
              texts: data.edge_media_to_caption.edges.map(
                entry => entry.node.text
              ),
              comments: data.edge_media_to_comment.count,
              address: data.location ? data.location.address_json : null,
              nameLocation: data.location ? data.location.name : null,
              slugLocation: data.location ? data.location.slug : null,
              idLocation: data.location ? data.location.id : null,
              tags: data.tags,
              taken_at_timestamp: data.taken_at_timestamp,
              shortcode: data.shortcode
            };
            // then add all entry in algolia
            index.addObject(wantedData, (err, content) => {
              if (err) {
                console.error("Impossible to insert object, due to", err);
              } else {
                console.warn("Insert object", content);
              }
              this.resume();
            });
            return wantedData;
          },
          function end() {
            console.warn("ENDED STREAM, check for delete object, next");
            // finally do a difference between what is already inside algolia and in the current scrap to avoid inconsistancy
            index.deleteObjects(
              postIdFromAlgolia.filter(x => !postIdFromSource.includes(x)),
              function(err, content) {
                if (err) return send(res, 400, err);

                console.warn("DELETED IDS:", content.objectID);
                console.warn("END PROCESSING, EXITING");
              }
            );
            this.emit("end");
            return send(res, 200, "Request processed!");
          }
        )
      );
    });
  });
};
