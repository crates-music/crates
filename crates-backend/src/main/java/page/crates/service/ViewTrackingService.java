package page.crates.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Crate;
import page.crates.entity.CrateView;
import page.crates.entity.SpotifyUser;
import page.crates.repository.CrateViewRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ViewTrackingService {
    
    private final CrateViewRepository crateViewRepository;
    
    @Transactional
    public void recordView(Crate crate, SpotifyUser viewer, HttpServletRequest request) {
        try {
            // Check if this is a duplicate view within the last hour
            Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
            
            if (viewer != null) {
                // Authenticated user - check if they've viewed this crate recently
                boolean hasViewedRecently = crateViewRepository.hasUserViewedRecently(crate, viewer, oneHourAgo);
                if (hasViewedRecently) {
                    log.debug("User {} has already viewed crate {} recently, skipping", viewer.getId(), crate.getId());
                    return;
                }
            } else {
                // Anonymous user - check by IP address
                String ipAddress = getClientIpAddress(request);
                if (ipAddress != null) {
                    boolean hasViewedRecently = crateViewRepository.hasIPViewedRecently(crate, ipAddress, oneHourAgo);
                    if (hasViewedRecently) {
                        log.debug("IP {} has already viewed crate {} recently, skipping", ipAddress, crate.getId());
                        return;
                    }
                }
            }
            
            // Record the view
            CrateView view = CrateView.builder()
                    .crate(crate)
                    .viewer(viewer)
                    .viewedAt(Instant.now())
                    .ipAddress(getClientIpAddress(request))
                    .userAgent(request.getHeader("User-Agent"))
                    .referrer(request.getHeader("Referer"))
                    .build();
            
            crateViewRepository.save(view);
            log.debug("Recorded view for crate {} by {}", crate.getId(), viewer != null ? viewer.getId() : "anonymous");
            
        } catch (Exception e) {
            log.error("Error recording view for crate {}: {}", crate.getId(), e.getMessage());
        }
    }
    
    @Transactional
    public void recordView(Crate crate, SpotifyUser viewer, String ipAddress, String userAgent, String referrer) {
        try {
            // Check if this is a duplicate view within the last hour
            Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
            
            if (viewer != null) {
                // Authenticated user - check if they've viewed this crate recently
                boolean hasViewedRecently = crateViewRepository.hasUserViewedRecently(crate, viewer, oneHourAgo);
                if (hasViewedRecently) {
                    log.debug("User {} has already viewed crate {} recently, skipping", viewer.getId(), crate.getId());
                    return;
                }
            } else {
                // Anonymous user - check by IP address
                if (ipAddress != null) {
                    boolean hasViewedRecently = crateViewRepository.hasIPViewedRecently(crate, ipAddress, oneHourAgo);
                    if (hasViewedRecently) {
                        log.debug("IP {} has already viewed crate {} recently, skipping", ipAddress, crate.getId());
                        return;
                    }
                }
            }
            
            // Record the view
            CrateView view = CrateView.builder()
                    .crate(crate)
                    .viewer(viewer)
                    .viewedAt(Instant.now())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .referrer(referrer)
                    .build();
            
            crateViewRepository.save(view);
            log.debug("Recorded view for crate {} by {}", crate.getId(), viewer != null ? viewer.getId() : "anonymous");
            
        } catch (Exception e) {
            log.error("Error recording view for crate {}: {}", crate.getId(), e.getMessage());
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        // Try various headers for IP address (handling proxies, load balancers, etc.)
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        
        // X-Forwarded-For can contain multiple IPs, take the first one
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        return ipAddress;
    }
}