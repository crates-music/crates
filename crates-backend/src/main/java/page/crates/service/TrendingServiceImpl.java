package page.crates.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import page.crates.entity.Crate;
import page.crates.repository.CrateRepository;
import page.crates.repository.CrateViewRepository;
import page.crates.repository.UserCrateCollectionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrendingServiceImpl implements TrendingService {

    // Trending algorithm weights
    private static final double COLLECTORS_LAST_7_DAYS_WEIGHT = 5.0;
    private static final double COLLECTORS_LAST_30_DAYS_WEIGHT = 2.0;
    private static final double TOTAL_COLLECTORS_WEIGHT = 0.5;
    private static final double TIME_DECAY_DIVISOR = 90.0;
    private static final double MIN_TIME_DECAY = 0.1;
    private static final double MAX_ENGAGEMENT_MULTIPLIER = 2.0;
    private static final double ENGAGEMENT_FACTOR = 10.0;
    private final CrateRepository crateRepository;
    private final UserCrateCollectionRepository userCrateCollectionRepository;
    private final CrateViewRepository crateViewRepository;

    private BigDecimal calculateTrendingScore(Crate crate, Instant now, Instant sevenDaysAgo, Instant thirtyDaysAgo) {
        // Get collection counts
        long collectorsLast7Days = userCrateCollectionRepository.countByCrateAndCreatedAtAfter(crate, sevenDaysAgo);
        long collectorsLast30Days = userCrateCollectionRepository.countByCrateAndCreatedAtAfter(crate, thirtyDaysAgo);
        long totalCollectors = crate.getFollowerCount();

        // Get view counts
        long viewsLast7Days = crateViewRepository.countByCrateAndViewedAtAfter(crate, sevenDaysAgo);
        long viewsLast30Days = crateViewRepository.countByCrateAndViewedAtAfter(crate, thirtyDaysAgo);

        // Calculate base score
        double baseScore = (collectorsLast7Days * COLLECTORS_LAST_7_DAYS_WEIGHT) +
                           (collectorsLast30Days * COLLECTORS_LAST_30_DAYS_WEIGHT) +
                           (totalCollectors * TOTAL_COLLECTORS_WEIGHT);

        // Calculate time decay factor
        // Find the most recent collection or view
        Instant lastActivity = getLastActivity(crate, now);
        long daysSinceLastActivity = ChronoUnit.DAYS.between(lastActivity, now);
        double timeDecay = Math.max(MIN_TIME_DECAY, 1.0 - (daysSinceLastActivity / TIME_DECAY_DIVISOR));

        // Calculate engagement multiplier
        // Higher ratio of collectors to views indicates better engagement
        double engagementMultiplier = 1.0;
        if (viewsLast30Days > 0) {
            double collectorToViewRatio = (double) collectorsLast30Days / viewsLast30Days;
            engagementMultiplier = Math.min(MAX_ENGAGEMENT_MULTIPLIER, collectorToViewRatio * ENGAGEMENT_FACTOR);
        }

        // Final score calculation
        double finalScore = baseScore * timeDecay * engagementMultiplier;

        return BigDecimal.valueOf(finalScore).setScale(4, RoundingMode.HALF_UP);
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    @Override
    public void calculateTrendingScores() {
        log.info("Starting trending score calculation");

        Instant now = Instant.now();
        Instant sevenDaysAgo = now.minus(7, ChronoUnit.DAYS);
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        // Get all public crates
        List<Crate> publicCrates = crateRepository.findAllByPublicCrateTrue();

        for (Crate crate : publicCrates) {
            try {
                BigDecimal trendingScore = calculateTrendingScore(crate, now, sevenDaysAgo, thirtyDaysAgo);
                crate.setTrendingScore(trendingScore);
                crate.setLastTrendingUpdate(now);
                crateRepository.save(crate);
            } catch (Exception e) {
                log.error("Error calculating trending score for crate {}: {}", crate.getId(), e.getMessage());
            }
        }

        log.info("Completed trending score calculation for {} crates", publicCrates.size());
    }

    private Instant getLastActivity(Crate crate, Instant defaultTime) {
        // Get the most recent collection
        Instant lastCollection = userCrateCollectionRepository.findLatestCollectionTime(crate);

        // Get the most recent view
        Instant lastView = crateViewRepository.findLatestViewTime(crate);

        // Return the most recent activity, or crate creation time if no activity
        Instant lastActivity = defaultTime;
        if (lastCollection != null) {
            lastActivity = lastCollection;
        }
        if (lastView != null && (lastCollection == null || lastView.isAfter(lastCollection))) {
            lastActivity = lastView;
        }
        if (lastActivity.equals(defaultTime)) {
            lastActivity = crate.getCreatedAt();
        }

        return lastActivity;
    }
}