# crates

![CRATES](https://app.crates.music/assets/images/crates-card-cropped.png)

Crates is a tool to organize your Spotify library albums into categories or "crates."

Crates lets you organize your albums into custom categories, making it easier to find the perfect soundtrack for any moment. Sync your Spotify library, organize your Crates, and rediscover the joy of full albums curated just the way you like.

## Live Version
check out the live version of this running at [app.crates.music](https://app.crates.music)

## Building and Running

### Requirements
You'll need java, maven, and docker.

### Running the Thing

1. Start up the database.
   ```shell
   cd crates-database
   ./mvnw clean install docker:start
   ```
2. Setup an `application-dev.properties` file in the resources folder with your spotify client ID and secret. See `application-dev-example.properties` for the format. 
3. Start up the backend.
   ```shell
   cd crates-backend
   ./restart.sh
   ```
4. Start up the frontend.
   ```shell
   cd crates-frontend
   yarn start
   ```
5. Open the UI [in the browser](http://localhost:4311)
   
## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the **GNU Affero General Public License v3.0**.
See the [LICENSE](LICENSE) file for details.
