# crates

![CRATES](https://app.crates.page/assets/images/crates-card-cropped.png)

Crates is a tool to organize your Spotify library albums into categories or "crates."

Crates lets you organize your albums into custom categories, making it easier to find the perfect soundtrack for any moment. Sync your Spotify library, organize your Crates, and rediscover the joy of full albums curated just the way you like.

## Live Version
check out the live version of this running at [app.crates.page](https://app.crates.page)

## TODO

- [X] Library UI - filters: uncrated-only by default
- [X] Library UI - search by title/artist
- [X] Library UI - loading state & poll for sync to be done 
- [X] Overall - Tabs
- [X] Overall - ngrx state management
- [ ] Crates - Better styling on list page (first 4 albums??)
- [X] Crates - search by title / album title
- [X] Crates - Crate settings page (title, public or not, delete crate)
- [ ] Crates - how to open in app on desktop (deep link)
- [X] Library Sync - stop syncing after first existing is hit
- [X] Library Sync - check for removed albums
- [ ] tommy idea - [📦] Create playlists with box icon at the front for each crate.
- [X] swap to root domain for share UI
- [ ] links from app to share UI for profiles and crates
- [X] handles for profiles
- [X] no slashes allowed in handles (other special character handling too, consider URL-encoding)
- [ ] main landing page isn't centered anymore
- [ ] need max width on the view layout
- [ ] fix double-tap issue on crate albums
- [ ] Profile - only show save if changes made
- [ ] Profile - Cancel should go "back", not always to Crates 
- [ ] following crates & users
- [ ] share landing page
- [ ] discover section in app

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
