package main

import (
	"encoding/json"
	"html/template"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var backendClient *BackendClient

// LoggingMiddleware provides structured logging for HTTP requests
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate correlation ID
		correlationID := c.GetHeader("X-Correlation-ID")
		if correlationID == "" {
			correlationID = generateCorrelationID()
		}
		c.Header("X-Correlation-ID", correlationID)

		// Get request classification from context (set by BotFilteringMiddleware)
		classification, exists := c.Get("requestClassification")
		if !exists {
			classification = ClassificationLegitimate
		}

		// Start timer
		start := time.Now()

		// Determine log level based on classification
		logLevel := logrus.InfoLevel
		if ShouldReduceLogging(classification.(RequestClassification)) {
			logLevel = logrus.DebugLevel
		}

		// Log request start with appropriate level
		logEntry := logrus.WithFields(logrus.Fields{
			"correlationId":  correlationID,
			"method":         c.Request.Method,
			"uri":            c.Request.RequestURI,
			"userAgent":      c.Request.UserAgent(),
			"remoteAddr":     c.ClientIP(),
			"classification": classification,
			"event":          "http_request_start",
		})

		if logLevel == logrus.InfoLevel {
			logEntry.Info("HTTP request started")
		} else {
			logEntry.Debug("HTTP request started (reduced logging)")
		}

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Now().Sub(start)

		// Log request completion with appropriate level
		logEntry = logrus.WithFields(logrus.Fields{
			"correlationId":  correlationID,
			"method":         c.Request.Method,
			"uri":            c.Request.RequestURI,
			"status":         c.Writer.Status(),
			"durationMs":     duration.Milliseconds(),
			"classification": classification,
			"event":          "http_request_complete",
		})

		if logLevel == logrus.InfoLevel {
			logEntry.Info("HTTP request completed")
		} else {
			logEntry.Debug("HTTP request completed (reduced logging)")
		}
	}
}

func generateCorrelationID() string {
	// Simple correlation ID generation
	return "pub-" + strconv.FormatInt(time.Now().UnixNano(), 36)[:8]
}

// BotFilteringMiddleware filters out obvious bot traffic and attack attempts
func BotFilteringMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip filtering for certain paths
		path := c.Request.URL.Path
		if path == "/health" || path == "/" || path == "/static" ||
			strings.HasPrefix(path, "/static/") || strings.HasPrefix(path, "/api/") {
			c.Next()
			return
		}

		// Extract username from path for validation
		username := ""
		if strings.HasPrefix(path, "/") && len(path) > 1 {
			pathParts := strings.Split(path[1:], "/")
			if len(pathParts) > 0 {
				username = pathParts[0]
			}
		}

		// Classify the request
		classification := ClassifyRequest(username, c.Request.UserAgent(), path)

		// Store classification in context for logging middleware
		c.Set("requestClassification", classification)

		// Block suspicious requests early
		if ShouldBlockRequest(classification) {
			logrus.WithFields(logrus.Fields{
				"classification": classification,
				"username":       username,
				"userAgent":      c.Request.UserAgent(),
				"path":           path,
				"remoteAddr":     c.ClientIP(),
				"action":         "blocked_early",
			}).Debug("Blocked suspicious request")

			c.HTML(http.StatusNotFound, "error.html", gin.H{
				"title":   "Not Found",
				"message": "The page you're looking for doesn't exist or isn't available.",
				"ogTitle": "Not Found - Crates",
				"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func RedirectMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Host == "crates.page" {
			target := "https://crates.music" + c.Request.URL.RequestURI()
			c.Redirect(http.StatusMovedPermanently, target)
			c.Abort()
			return
		}
		c.Next()
	}
}

func main() {
	// Configure structured logging
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02T15:04:05.000Z",
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "timestamp",
			logrus.FieldKeyLevel: "level",
			logrus.FieldKeyMsg:   "message",
		},
	})
	logrus.SetLevel(logrus.InfoLevel)

	// Add service metadata to all logs
	logrus.WithFields(logrus.Fields{
		"service": "crates-public",
		"version": "1.0.0",
	}).Info("Starting crates public service")

	// Initialize backend client
	backendClient = NewBackendClient()

	// Initialize Gin router with custom logger
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(BotFilteringMiddleware())
	r.Use(LoggingMiddleware())
	r.Use(RedirectMiddleware())

	// Load HTML templates with custom functions
	r.SetFuncMap(template.FuncMap{
		"json": func(v interface{}) template.JS {
			b, _ := json.Marshal(v)
			return template.JS(b)
		},
	})
	r.LoadHTMLGlob("templates/*")

	// Serve static files
	r.Static("/static", "./static")

	// Setup routes
	setupRoutes(r)

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logrus.WithFields(logrus.Fields{
		"port":       port,
		"backendURL": backendClient.BaseURL,
	}).Info("Server starting")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		logrus.WithError(err).Fatal("Server failed to start")
	}
}

func setupRoutes(r *gin.Engine) {
	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Home page - exact match first
	r.GET("/", func(c *gin.Context) {
		logrus.WithField("route", "home").Debug("Home page route hit")
		handleHomePage(c)
	})

	// Privacy policy page
	r.GET("/privacy-policy", func(c *gin.Context) {
		c.HTML(http.StatusOK, "privacy-policy.html", gin.H{
			"title":   "Privacy Policy - Crates",
			"ogTitle": "Privacy Policy - Crates",
			"ogDesc":  "Crates Privacy Policy - Learn how we protect your data and respect your privacy.",
			"ogURL":   c.Request.URL.String(),
		})
	})

	// Terms of service page
	r.GET("/terms-of-service", func(c *gin.Context) {
		c.HTML(http.StatusOK, "terms-of-service.html", gin.H{
			"title":   "Terms of Service - Crates",
			"ogTitle": "Terms of Service - Crates",
			"ogDesc":  "Crates Terms of Service - Review the terms and conditions for using our service.",
			"ogURL":   c.Request.URL.String(),
		})
	})

	// API routes for AJAX - must come before wildcard routes
	api := r.Group("/api")
	{
		api.GET("/:username/crates", handleUserCratesAPI)
		api.GET("/:username/collection", handleUserCollectionAPI)
		api.GET("/:username/:handle/albums", handleCrateAlbumsAPI)
		api.GET("/:username/collection/:handle/albums", handleCollectionCrateAlbumsAPI)
	}

	// Profile page - /{username}
	r.GET("/:username", func(c *gin.Context) {
		username := c.Param("username")
		logrus.WithFields(logrus.Fields{
			"route":    "profile",
			"username": username,
		}).Debug("Profile route hit")
		handleProfilePage(c)
	})

	// Collection crate page - /{username}/collection/{handle}
	r.GET("/:username/collection/:handle", func(c *gin.Context) {
		username := c.Param("username")
		handle := c.Param("handle")
		logrus.WithFields(logrus.Fields{
			"route":    "collection_crate",
			"username": username,
			"handle":   handle,
		}).Debug("Collection crate route hit")
		handleCollectionCratePage(c)
	})

	// Crate page - /{username}/{handle}
	r.GET("/:username/:handle", func(c *gin.Context) {
		username := c.Param("username")
		handle := c.Param("handle")
		logrus.WithFields(logrus.Fields{
			"route":    "crate",
			"username": username,
			"handle":   handle,
		}).Debug("Crate route hit")
		handleCratePage(c)
	})
}

func handleProfilePage(c *gin.Context) {
	username := c.Param("username")

	// Fetch user profile from backend
	user, err := backendClient.GetUser(username)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_for_profile",
			"error":    err.Error(),
		}).Error("Failed to fetch user for profile page - rendering error template")

		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Not Found",
			"message": "The page you're looking for doesn't exist or isn't available.",
			"ogTitle": "Not Found - Crates",
			"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
		})
		return
	}

	logrus.WithFields(logrus.Fields{
		"username": username,
		"userId":   user.ID,
		"action":   "fetch_user_for_profile",
	}).Debug("Successfully fetched user for profile page")

	// Fetch initial authored crates (first page)
	crates, err := backendClient.GetUserCrates(username, 0, 12, "", "updatedAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_crates_profile",
		}).WithError(err).Warn("Failed to fetch user crates for profile, using empty list")
		crates = &Page[Crate]{Content: []Crate{}}
	}

	// Fetch initial collection (first page)
	collection, err := backendClient.GetUserCollection(username, 0, 12, "", "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_collection_profile",
		}).WithError(err).Warn("Failed to fetch user collection for profile, using empty list")
		collection = &Page[Crate]{Content: []Crate{}}
	}

	// Fetch user social stats
	socialStats, err := backendClient.GetUserSocialStats(username)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_social_stats",
		}).WithError(err).Warn("Failed to fetch user social stats, using zero values")
		socialStats = &SocialStats{FollowingCount: 0, FollowerCount: 0}
	}

	c.HTML(http.StatusOK, "profile.html", gin.H{
		"title":             user.DisplayName + " - Crates",
		"user":              user,
		"crates":            crates.Content,
		"hasMoreCrates":     !crates.Last,
		"collection":        collection.Content,
		"hasMoreCollection": !collection.Last,
		"socialStats":       socialStats,
		"ogTitle":           user.DisplayName + " - Crates",
		"ogDesc":            "Check out " + user.DisplayName + "'s music crates and collection",
		"ogImage":           getFirstImage(user.Images),
		"ogURL":             c.Request.URL.String(),
	})
}

func handleCratePage(c *gin.Context) {
	username := c.Param("username")
	handle := c.Param("handle")

	// Fetch user and crate data from backend
	user, err := backendClient.GetUser(username)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_for_crate",
		}).WithError(err).Error("Failed to fetch user for crate page")
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Not Found",
			"message": "The page you're looking for doesn't exist or isn't available.",
			"ogTitle": "Not Found - Crates",
			"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
		})
		return
	}

	crate, err := backendClient.GetCrate(username, handle)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"handle":   handle,
			"action":   "fetch_crate",
		}).WithError(err).Error("Failed to fetch crate")
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Not Found",
			"message": "The page you're looking for doesn't exist or isn't available.",
			"ogTitle": "Not Found - Crates",
			"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
		})
		return
	}

	// Record the view for analytics (async, don't block page load)
	go func() {
		err := backendClient.RecordCrateView(crate.ID, c.ClientIP(), c.Request.UserAgent(), c.Request.Referer())
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"crateID": crate.ID,
				"action":  "record_crate_view",
			}).WithError(err).Debug("Failed to record crate view")
		}
	}()

	// Fetch initial albums (first page)
	albums, err := backendClient.GetCrateAlbums(username, handle, 0, 20, "", "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"handle": handle,
			"action": "fetch_crate_albums",
		}).WithError(err).Error("Failed to fetch crate albums")
		albums = &Page[CrateAlbum]{Content: []CrateAlbum{}}
	}

	firstAlbumImage := ""
	if len(albums.Content) > 0 && len(albums.Content[0].Album.Images) > 0 {
		firstAlbumImage = albums.Content[0].Album.Images[0].URL
	}

	c.HTML(http.StatusOK, "crate.html", gin.H{
		"title":   crate.Name + " by " + user.DisplayName,
		"user":    user,
		"crate":   crate,
		"albums":  albums.Content,
		"hasMore": !albums.Last,
		"ogTitle": crate.Name + " by " + user.DisplayName,
		"ogDesc":  "A music crate with " + strconv.Itoa(albums.TotalElements) + " albums",
		"ogImage": firstAlbumImage,
		"ogURL":   c.Request.URL.String(),
	})
}

func handleUserCratesAPI(c *gin.Context) {
	username := c.Param("username")
	page := getPageFromQuery(c.Query("page"))
	size := getSizeFromQuery(c.Query("size"))
	search := c.Query("search")

	crates, err := backendClient.GetUserCrates(username, page, size, search, "updatedAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_crates_api",
		}).WithError(err).Error("Failed to fetch user crates")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch crates"})
		return
	}

	c.JSON(http.StatusOK, crates)
}

func handleCrateAlbumsAPI(c *gin.Context) {
	username := c.Param("username")
	handle := c.Param("handle")
	page := getPageFromQuery(c.Query("page"))
	size := getSizeFromQuery(c.Query("size"))
	search := c.Query("search")

	albums, err := backendClient.GetCrateAlbums(username, handle, page, size, search, "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"handle": handle,
			"action": "fetch_crate_albums_api",
		}).WithError(err).Error("Failed to fetch crate albums")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch albums"})
		return
	}

	c.JSON(http.StatusOK, albums)
}

func handleHomePage(c *gin.Context) {
	logrus.WithField("action", "render_home_page").Debug("Rendering home page template")

	// Fetch trending crates for the featured section
	featuredCrates := []gin.H{}
	cratesResponse, err := backendClient.GetTrendingCrates(0, 6)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"action": "fetch_trending_crates",
			"error":  err.Error(),
		}).Warn("Failed to fetch trending crates, falling back to recent crates")

		// Fallback to recent crates if trending fails
		cratesResponse, err = backendClient.GetAllPublicCrates(0, 6, "createdAt,desc")
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"action": "fetch_recent_crates_fallback",
				"error":  err.Error(),
			}).Warn("Failed to fetch recent crates fallback, continuing with empty list")
		}
	}

	if cratesResponse != nil {
		// Transform crates with real user information
		for _, crate := range cratesResponse.Content {
			ownerName := "Unknown"
			ownerSpotifyId := "unknown"

			if crate.User != nil {
				ownerSpotifyId = crate.User.SpotifyID

				// Use custom handle if available, otherwise fall back to spotifyId
				if crate.User.Handle != nil && *crate.User.Handle != "" {
					ownerName = *crate.User.Handle
				} else {
					ownerName = crate.User.SpotifyID
				}
			}

			featuredCrate := gin.H{
				"id":             crate.ID,
				"name":           crate.Name,
				"handle":         crate.Handle,
				"ownerName":      ownerName,
				"ownerSpotifyId": ownerSpotifyId,
				"imageUri":       crate.ImageURI,
				"createdAt":      crate.CreatedAt,
				"followerCount":  crate.FollowerCount,
			}
			featuredCrates = append(featuredCrates, featuredCrate)
		}
	}

	data := gin.H{
		"title":          "Crates - Organize Your Spotify Albums",
		"ogTitle":        "Crates - Organize Your Spotify Albums",
		"ogDesc":         "Organize your Spotify albums into custom categories, discover curated collections from other music lovers, and rediscover the joy of full albums.",
		"ogImage":        "https://crates.page/static/images/crates-card.png",
		"ogURL":          "https://crates.page",
		"featuredCrates": featuredCrates,
	}

	logrus.WithFields(logrus.Fields{
		"action":              "render_home_page",
		"featuredCratesCount": len(featuredCrates),
	}).Debug("Rendering home template with data")
	c.HTML(http.StatusOK, "home.html", data)
	logrus.WithField("action", "render_home_page").Debug("Finished rendering home template")
}

func handleCollectionCratePage(c *gin.Context) {
	username := c.Param("username")
	handle := c.Param("handle")

	// Fetch user and collection crate data from backend
	user, err := backendClient.GetUser(username)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_for_collection_crate",
		}).WithError(err).Error("Failed to fetch user for collection crate page")
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Not Found",
			"message": "The page you're looking for doesn't exist or isn't available.",
			"ogTitle": "Not Found - Crates",
			"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
		})
		return
	}

	crate, err := backendClient.GetCollectionCrate(username, handle)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"handle":   handle,
			"action":   "fetch_collection_crate",
		}).WithError(err).Error("Failed to fetch collection crate")
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Not Found",
			"message": "The page you're looking for doesn't exist or isn't available.",
			"ogTitle": "Not Found - Crates",
			"ogDesc":  "The page you're looking for doesn't exist or isn't available.",
		})
		return
	}

	// Record the view for analytics (async, don't block page load)
	go func() {
		err := backendClient.RecordCrateView(crate.ID, c.ClientIP(), c.Request.UserAgent(), c.Request.Referer())
		if err != nil {
			logrus.WithFields(logrus.Fields{
				"crateID": crate.ID,
				"action":  "record_collection_crate_view",
			}).WithError(err).Debug("Failed to record collection crate view")
		}
	}()

	// Fetch initial albums (first page)
	albums, err := backendClient.GetCollectionCrateAlbums(username, handle, 0, 20, "", "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"handle": handle,
			"action": "fetch_collection_crate_albums",
		}).WithError(err).Error("Failed to fetch collection crate albums")
		albums = &Page[CrateAlbum]{Content: []CrateAlbum{}}
	}

	firstAlbumImage := ""
	if len(albums.Content) > 0 && len(albums.Content[0].Album.Images) > 0 {
		firstAlbumImage = albums.Content[0].Album.Images[0].URL
	}

	c.HTML(http.StatusOK, "crate.html", gin.H{
		"title":        crate.Name + " (collected by " + user.DisplayName + ")",
		"user":         user,
		"crate":        crate,
		"albums":       albums.Content,
		"hasMore":      !albums.Last,
		"isCollection": true,
		"ogTitle":      crate.Name + " (collected by " + user.DisplayName + ")",
		"ogDesc":       "A music crate with " + strconv.Itoa(albums.TotalElements) + " albums, collected by " + user.DisplayName,
		"ogImage":      firstAlbumImage,
		"ogURL":        c.Request.URL.String(),
	})
}

func handleUserCollectionAPI(c *gin.Context) {
	username := c.Param("username")
	page := getPageFromQuery(c.Query("page"))
	size := getSizeFromQuery(c.Query("size"))
	search := c.Query("search")

	collection, err := backendClient.GetUserCollection(username, page, size, search, "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"action":   "fetch_user_collection_api",
		}).WithError(err).Error("Failed to fetch user collection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collection"})
		return
	}

	c.JSON(http.StatusOK, collection)
}

func handleCollectionCrateAlbumsAPI(c *gin.Context) {
	username := c.Param("username")
	handle := c.Param("handle")
	page := getPageFromQuery(c.Query("page"))
	size := getSizeFromQuery(c.Query("size"))
	search := c.Query("search")

	albums, err := backendClient.GetCollectionCrateAlbums(username, handle, page, size, search, "createdAt,desc")
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"handle": handle,
			"action": "fetch_collection_crate_albums",
		}).WithError(err).Error("Failed to fetch collection crate albums")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch albums"})
		return
	}

	c.JSON(http.StatusOK, albums)
}

func getFirstImage(images []Image) string {
	if len(images) > 0 {
		return images[0].URL
	}
	return ""
}
