package page.crates.spotify.client;

import com.fasterxml.jackson.databind.Module;
import feign.Response;
import feign.jackson.JacksonDecoder;

import java.io.IOException;
import java.lang.reflect.Type;

public class SpotifyJacksonDecoder extends JacksonDecoder {

    public SpotifyJacksonDecoder(Iterable<Module> modules) {
        super(modules);
    }

    @Override
    public Object decode(Response response, Type type) throws IOException {
        // TODO: some kind of response to 429s
        return super.decode(response, type);
    }
}
