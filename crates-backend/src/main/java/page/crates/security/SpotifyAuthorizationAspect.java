package page.crates.security;

import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import page.crates.entity.SpotifyUser;
import page.crates.exception.UnauthorizedAccessException;
import page.crates.repository.SpotifyUserRepository;

import java.util.Optional;

@Aspect
@Slf4j
@Component
public class SpotifyAuthorizationAspect {
    @Resource
    private SpotifyUserRepository spotifyUserRepository;

    @Around("@annotation(page.crates.security.SpotifyAuthorization)")
    public Object authorize(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                .getRequest();
        String token = request.getHeader("x-crates-auth-token");
        if (StringUtils.isBlank(token)) {
            throw new UnauthorizedAccessException();
        }
        final Optional<SpotifyUser> user = spotifyUserRepository.findOneByTokenAuthToken(token);
        if (user.isEmpty()) {
            throw new UnauthorizedAccessException();
        }
        UserContextHolder.setUserContext(user.get());
        return joinPoint.proceed();
    }
}
