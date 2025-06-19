package main

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

var backendClient *BackendClient

func main() {
	// Initialize backend client
	backendClient = NewBackendClient()

	// Initialize Gin router
	r := gin.Default()

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

	log.Printf("Server starting on port %s", port)
	log.Printf("Backend URL: %s", backendClient.BaseURL)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func setupRoutes(r *gin.Engine) {
	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Profile page - /{username}
	r.GET("/:username", handleProfilePage)

	// Crate page - /{username}/{handle}
	r.GET("/:username/:handle", handleCratePage)

	// API routes for AJAX
	api := r.Group("/api")
	{
		api.GET("/:username/crates", handleUserCratesAPI)
		api.GET("/:username/:handle/albums", handleCrateAlbumsAPI)
	}
}

func handleProfilePage(c *gin.Context) {
	username := c.Param("username")

	// Fetch user profile from backend
	user, err := backendClient.GetUser(username)
	if err != nil {
		log.Printf("Error fetching user %s: %v", username, err)
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "User Not Found",
			"message": "User not found or profile is private",
		})
		return
	}

	// Fetch initial crates (first page)
	crates, err := backendClient.GetUserCrates(username, 0, 12, "")
	if err != nil {
		log.Printf("Error fetching crates for user %s: %v", username, err)
		crates = &Page[Crate]{Content: []Crate{}}
	}

	c.HTML(http.StatusOK, "profile.html", gin.H{
		"title":      user.DisplayName + " - Crates",
		"user":       user,
		"crates":     crates.Content,
		"hasMore":    !crates.Last,
		"ogTitle":    user.DisplayName + " - Crates",
		"ogDesc":     "Check out " + user.DisplayName + "'s music crates",
		"ogImage":    getFirstImage(user.Images),
		"ogURL":      c.Request.URL.String(),
	})
}

func handleCratePage(c *gin.Context) {
	username := c.Param("username")
	handle := c.Param("handle")

	// Fetch user and crate data from backend
	user, err := backendClient.GetUser(username)
	if err != nil {
		log.Printf("Error fetching user %s: %v", username, err)
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "User Not Found",
			"message": "User not found",
		})
		return
	}

	crate, err := backendClient.GetCrate(username, handle)
	if err != nil {
		log.Printf("Error fetching crate %s for user %s: %v", handle, username, err)
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title":   "Crate Not Found",
			"message": "Crate not found or is private",
		})
		return
	}

	// Fetch initial albums (first page)
	albums, err := backendClient.GetCrateAlbums(username, handle, 0, 20, "")
	if err != nil {
		log.Printf("Error fetching albums for crate %s: %v", handle, err)
		albums = &Page[CrateAlbum]{Content: []CrateAlbum{}}
	}

	firstAlbumImage := ""
	if len(albums.Content) > 0 && len(albums.Content[0].Album.Images) > 0 {
		firstAlbumImage = albums.Content[0].Album.Images[0].URL
	}

	c.HTML(http.StatusOK, "crate.html", gin.H{
		"title":      crate.Name + " by " + user.DisplayName,
		"user":       user,
		"crate":      crate,
		"albums":     albums.Content,
		"hasMore":    !albums.Last,
		"ogTitle":    crate.Name + " by " + user.DisplayName,
		"ogDesc":     "A music crate with " + strconv.Itoa(albums.TotalElements) + " albums",
		"ogImage":    firstAlbumImage,
		"ogURL":      c.Request.URL.String(),
	})
}

func handleUserCratesAPI(c *gin.Context) {
	username := c.Param("username")
	page := getPageFromQuery(c.Query("page"))
	size := getSizeFromQuery(c.Query("size"))
	search := c.Query("search")

	crates, err := backendClient.GetUserCrates(username, page, size, search)
	if err != nil {
		log.Printf("Error fetching crates for user %s: %v", username, err)
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

	albums, err := backendClient.GetCrateAlbums(username, handle, page, size, search)
	if err != nil {
		log.Printf("Error fetching albums for crate %s: %v", handle, err)
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