package page.crates.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
    private static final String REQUEST_ID_MDC_KEY = "requestId";
    private static final String USER_ID_MDC_KEY = "userId";
    private static final String METHOD_MDC_KEY = "method";
    private static final String URI_MDC_KEY = "uri";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // Generate or extract correlation ID
            String correlationId = extractCorrelationId(request);
            String requestId = UUID.randomUUID().toString().substring(0, 8);
            
            // Add to MDC for logging
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
            MDC.put(REQUEST_ID_MDC_KEY, requestId);
            MDC.put(METHOD_MDC_KEY, request.getMethod());
            MDC.put(URI_MDC_KEY, request.getRequestURI());
            
            // Add user ID if available
            if (UserContextHolder.getUserContext() != null) {
                MDC.put(USER_ID_MDC_KEY, UserContextHolder.getUserContext().getId().toString());
            }
            
            // Add correlation ID to response header
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            
            // Log request start
            long startTime = System.currentTimeMillis();
            log.info("HTTP request started {}",
                new StructuredLogEntry()
                    .with("event", "http_request_start")
                    .with("method", request.getMethod())
                    .with("uri", request.getRequestURI())
                    .with("queryString", request.getQueryString())
                    .with("userAgent", request.getHeader("User-Agent"))
                    .with("remoteAddr", getClientIpAddress(request))
            );
            
            try {
                filterChain.doFilter(request, response);
            } finally {
                // Log request completion
                long duration = System.currentTimeMillis() - startTime;
                log.info("HTTP request completed {}",
                    new StructuredLogEntry()
                        .with("event", "http_request_complete")
                        .with("method", request.getMethod())
                        .with("uri", request.getRequestURI())
                        .with("status", response.getStatus())
                        .with("durationMs", duration)
                );
            }
            
        } finally {
            // Clear MDC to prevent memory leaks
            MDC.clear();
        }
    }

    private String extractCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.trim().isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}