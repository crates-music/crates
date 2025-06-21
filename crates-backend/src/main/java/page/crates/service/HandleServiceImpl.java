package page.crates.service;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class HandleServiceImpl implements HandleService {

    private static final Pattern UNSAFE_CHARS = Pattern.compile("[^a-zA-Z0-9\\s-]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern MULTIPLE_HYPHENS = Pattern.compile("-+");

    @Override
    public String handelize(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "untitled";
        }
        
        // Normalize unicode characters (NFD = canonical decomposition)
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        
        // Remove diacritics and non-ASCII characters
        String ascii = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        
        // Remove unsafe characters (keep only alphanumeric, spaces, and hyphens)
        String safe = UNSAFE_CHARS.matcher(ascii).replaceAll("");
        
        // Replace whitespace with hyphens
        String hyphenated = WHITESPACE.matcher(safe).replaceAll("-");
        
        // Collapse multiple hyphens into single hyphens
        String collapsed = MULTIPLE_HYPHENS.matcher(hyphenated).replaceAll("-");
        
        // Convert to lowercase and trim hyphens from ends
        String result = collapsed.toLowerCase(Locale.ROOT).replaceAll("^-+|-+$", "");
        
        // Ensure we have a valid handle
        if (result.isEmpty()) {
            return "untitled";
        }
        
        // Limit length to 50 characters to leave room for uniqueness suffixes
        if (result.length() > 50) {
            result = result.substring(0, 50).replaceAll("-+$", "");
        }
        
        return result;
    }
}
