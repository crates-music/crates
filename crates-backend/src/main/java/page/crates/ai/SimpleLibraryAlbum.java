package page.crates.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal representation of a library album for AI analysis.
 * Keeps token usage low while providing essential context.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleLibraryAlbum {
    private String artist;
    private String album;
    private String year; // will be formatted as "2023" or "1990s" for older albums
    
    @Override
    public String toString() {
        return String.format("%s - %s (%s)", artist, album, year);
    }
}