<div align="center">
  <a href="https://www.algolia.com/">
    <img src="media/algolia.png" alt="algolia logo" width="200" height="200">
  </a>
  <a href="https://www.instagram.com/">
    <img src="media/instagram.png" alt="instagram logo" width="200" height="200">
  </a>
</div>

<h1 align="center">InstAgolia</h1>

> Lambda like to go from Instagram data account to Algolia search data.

## What's the point ?

**InstAgolia** is a docker HTTP based application that scrap Instagram user data of a profile ([Instagram Scraper](https://github.com/rarcega/instagram-scraper)) and then transform these volume of data to put everything in Algolia index to be able to add useful feature on top of it.

## How's made ?

All you have to do is:

- `ENV: $PORT=3000`
- `yarn or npm install`
- `yarn start`

Then a light HTTP server will be launched.

But it works best with the Dockerfile at the root of the project, like this in whatever environnment everything can be launched:

- Build images:
  `docker build -t instagolia:1.0 ./`

- Launch container
  `docker run -d -p 3000:3000 instagolia:1.0`

## A little bit of configuration

A bunch of env variables have to be provided in order to work:

- `PORT`

  - You can provide a specific port to bind to, this is useful when you want to deploy the container on cloud platform that provide the port.
  - _default: 3000_

- `ALGOLIA_APPID`

  - The appID, this is your unique application identifier.
  - _required_
  - **Init time variable**.

- `ALGOLIA_ADMIN_KEY`

  - This is the ADMIN API key, used for query index backend.
  - _required_
  - **Init time variable**.

- `ALGOLIA_INDEX`

  - This is the name of your index where you want to store data.
  - _required_
  - To give more flexibility, you can also pass a **json body** with the `index` property when doing your HTTP request, like so: `{ index: 'your_index_name' }`, the priority will be the json provided. **Run time variable**.
  - However, for the moment, you have to create the index manually before with the Algolia dashboard.

- `TARGET_ACCOUNT`

  - The name of the Instagram account of the target.
  - _required_
  - Like the variable above, you can specify a `targetAccount` property. Same priority. **Run time variable**.

- `USER_ACCOUNT`

  - The Instagram scraper need a authentified account, so we need to provide `user/pass` informations.
  - _required_
  - **Init time variable**.

- `PASS_ACCOUNT`

  - Like we said above, we need user/pass, so here is the `pass`
  - _required_
  - **Init time variable**.

- `URL_TO_HIT`

  - For whatever reason, you may want to have a specific url to HIT to trigger the scraping/storage.
  - _default: /_
  - **Init time variable**.

- `METHOD_TO_HIT`
  - You might also want to trigger a specific METHOD.
  - _default: POST_
  - **Init time variable**.

## In the cloud

That **pipeline** work very well on cloud infrastructure such as Heroku with their container system.

## Datasets

The dataset we receive from the Instagram scraper is like the following:

```json
{
  "__typename": "GraphImage",
  "comments_disabled": false,
  "dimensions": {
    "height": 1350,
    "width": 1080
  },
  "display_url": "String",
  "edge_media_preview_like": {
    "count": 0
  },
  "edge_media_to_caption": {
    "edges": [
      {
        "node": {
          "text": "text"
        }
      }
    ]
  },
  "edge_media_to_comment": {
    "count": 0
  },
  "gating_info": null,
  "id": "String",
  "is_video": false,
  "location": {
    "address_json": "String",
    "has_public_page": true,
    "id": "758238628",
    "name": "name",
    "slug": "name-computer-readable"
  },
  "media_preview": "ACEqqGrkNqHH7w7Wbp04+vrn8OlVY13tgfU/QdTV4qSAf7oz19c/40pyaskOMb6sia0AXIYMwBOAODj0Of6VXAq8sZTcwwDyec9TjI9gSKoA804Sbun0CStZofiikzRWhmXJtlsohTl2GWb1I5x9O1SZLqCf4oxVW7UCQY5OeT/MD2GcfWrcZJ4IwO304z+X8sVzT3+R1LayJJvunHrWOZN53HAz1x0zWlOPlJB6dPwyf61kOS5L9yckDpV0+pnPZInxRTc0VsYmlHF5zFz06ClLKmFz8wPGT2H/ANapjxEMVy9wxM5yTwRWUlzG97HRzyLleVBBBIJ/n9QMYrC3dx0zVOVixJJJO48mtG45KnuUWnFWRnJ3I99FQ0VRJ//Z",
  "owner": {
    "id": "121212"
  },
  "shortcode": "1qsndqsd",
  "tags": ["String", "String", "String", "String"],
  "taken_at_timestamp": 1550826160,
  "thumbnail_resources": [
    {
      "config_height": 150,
      "config_width": 150,
      "src": "image-link"
    },
    {
      "config_height": 240,
      "config_width": 240,
      "src": "image-link"
    },
    {
      "config_height": 320,
      "config_width": 320,
      "src": "image-link"
    },
    {
      "config_height": 480,
      "config_width": 480,
      "src": "image-link"
    },
    {
      "config_height": 640,
      "config_width": 640,
      "src": "image-link"
    }
  ],
  "thumbnail_src": "images-link",
  "urls": ["image-link"],
  "username": "username"
}
```

However, we are only storing these values in Algolia:

```
objectID
display_url
likes
texts
comments
address
nameLocation
slugLocation
idLocation
tags
taken_at_timestamp
shortcode
```

## License

MIT
