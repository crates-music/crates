package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"
)

type BackendClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type User struct {
	ID          int64   `json:"id"`
	SpotifyID   string  `json:"spotifyId"`
	DisplayName string  `json:"displayName"`
	Email       string  `json:"email"`
	Handle      *string `json:"handle"`
	Bio         *string `json:"bio"`
	Images      []Image `json:"images"`
}

type PublicUser struct {
	SpotifyID   string  `json:"spotifyId"`
	DisplayName string  `json:"displayName"`
	Handle      *string `json:"handle"`
	Bio         *string `json:"bio"`
	Images      []Image `json:"images"`
}

type Crate struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name"`
	Handle        string    `json:"handle"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	State         string    `json:"state"`
	ImageURI      string    `json:"imageUri"`
	PublicCrate   bool      `json:"publicCrate"`
	Description   *string   `json:"description"`
	User          *PublicUser `json:"user"`
	FollowerCount int       `json:"followerCount"`
}

type Album struct {
	ID          int64     `json:"id"`
	SpotifyID   string    `json:"spotifyId"`
	Name        string    `json:"name"`
	Popularity  int       `json:"popularity"`
	ReleaseDate time.Time `json:"releaseDate"`
	AddedAt     time.Time `json:"addedAt"`
	Artists     []Artist  `json:"artists"`
	Images      []Image   `json:"images"`
	Genres      []Genre   `json:"genres"`
}

type CrateAlbum struct {
	ID        int64     `json:"id"`
	Album     Album     `json:"album"`
	CreatedAt time.Time `json:"createdAt"`
}

type Artist struct {
	ID        int64  `json:"id"`
	SpotifyID string `json:"spotifyId"`
	Name      string `json:"name"`
	Href      string `json:"href"`
}

type Image struct {
	ID     int64  `json:"id"`
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
}

type Genre struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type Page[T any] struct {
	Content          []T  `json:"content"`
	TotalPages       int  `json:"totalPages"`
	TotalElements    int  `json:"totalElements"`
	Size             int  `json:"size"`
	Number           int  `json:"number"`
	NumberOfElements int  `json:"numberOfElements"`
	First            bool `json:"first"`
	Last             bool `json:"last"`
	Empty            bool `json:"empty"`
}

type SocialStats struct {
	FollowingCount int64 `json:"followingCount"`
	FollowerCount  int64 `json:"followerCount"`
}

func NewBackendClient() *BackendClient {
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8980"
	}

	return &BackendClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (bc *BackendClient) makeRequest(url string) ([]byte, error) {
	resp, err := bc.HTTPClient.Get(bc.BaseURL + url)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return body, nil
}

func (bc *BackendClient) GetUser(username string) (*User, error) {
	url := fmt.Sprintf("/v1/public/user/%s", username)
	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var user User
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, fmt.Errorf("failed to parse user response: %w", err)
	}

	return &user, nil
}

func (bc *BackendClient) GetUserCrates(username string, page, size int, search, sort string) (*Page[Crate], error) {
	url := fmt.Sprintf("/v1/public/user/%s/crates?page=%d&size=%d", username, page, size)
	if search != "" {
		url += "&search=" + search
	}
	if sort != "" {
		url += "&sort=" + sort
	}

	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var crates Page[Crate]
	if err := json.Unmarshal(body, &crates); err != nil {
		return nil, fmt.Errorf("failed to parse crates response: %w", err)
	}

	return &crates, nil
}

func (bc *BackendClient) GetCrate(username, handle string) (*Crate, error) {
	url := fmt.Sprintf("/v1/public/user/%s/crate/%s", username, handle)
	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var crate Crate
	if err := json.Unmarshal(body, &crate); err != nil {
		return nil, fmt.Errorf("failed to parse crate response: %w", err)
	}

	return &crate, nil
}

func (bc *BackendClient) GetCrateAlbums(username, handle string, page, size int, search, sort string) (*Page[CrateAlbum], error) {
	url := fmt.Sprintf("/v1/public/user/%s/crate/%s/albums?page=%d&size=%d", username, handle, page, size)
	if search != "" {
		url += "&search=" + search
	}
	if sort != "" {
		url += "&sort=" + sort
	}

	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var albums Page[CrateAlbum]
	if err := json.Unmarshal(body, &albums); err != nil {
		return nil, fmt.Errorf("failed to parse albums response: %w", err)
	}

	return &albums, nil
}

func (bc *BackendClient) GetAllPublicCrates(page, size int, sort string) (*Page[Crate], error) {
	url := fmt.Sprintf("/v1/public/crates?page=%d&size=%d", page, size)
	if sort != "" {
		url += "&sort=" + sort
	}

	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var crates Page[Crate]
	if err := json.Unmarshal(body, &crates); err != nil {
		return nil, fmt.Errorf("failed to parse public crates response: %w", err)
	}

	return &crates, nil
}

func (bc *BackendClient) GetUserCollection(username string, page, size int, search, sort string) (*Page[Crate], error) {
	url := fmt.Sprintf("/v1/public/user/%s/collection?page=%d&size=%d", username, page, size)
	if search != "" {
		url += "&search=" + search
	}
	if sort != "" {
		url += "&sort=" + sort
	}

	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var crates Page[Crate]
	if err := json.Unmarshal(body, &crates); err != nil {
		return nil, fmt.Errorf("failed to parse collection response: %w", err)
	}

	return &crates, nil
}

func (bc *BackendClient) GetCollectionCrate(username, handle string) (*Crate, error) {
	url := fmt.Sprintf("/v1/public/user/%s/collection/%s", username, handle)
	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var crate Crate
	if err := json.Unmarshal(body, &crate); err != nil {
		return nil, fmt.Errorf("failed to parse collection crate response: %w", err)
	}

	return &crate, nil
}

func (bc *BackendClient) GetCollectionCrateAlbums(username, handle string, page, size int, search, sort string) (*Page[CrateAlbum], error) {
	url := fmt.Sprintf("/v1/public/user/%s/collection/%s/albums?page=%d&size=%d", username, handle, page, size)
	if search != "" {
		url += "&search=" + search
	}
	if sort != "" {
		url += "&sort=" + sort
	}

	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var albums Page[CrateAlbum]
	if err := json.Unmarshal(body, &albums); err != nil {
		return nil, fmt.Errorf("failed to parse collection albums response: %w", err)
	}

	return &albums, nil
}

func (bc *BackendClient) GetUserSocialStats(username string) (*SocialStats, error) {
	url := fmt.Sprintf("/v1/public/user/%s/stats", username)
	body, err := bc.makeRequest(url)
	if err != nil {
		return nil, err
	}

	var stats SocialStats
	if err := json.Unmarshal(body, &stats); err != nil {
		return nil, fmt.Errorf("failed to parse social stats response: %w", err)
	}

	return &stats, nil
}

func getPageFromQuery(query string) int {
	if query == "" {
		return 0
	}
	page, err := strconv.Atoi(query)
	if err != nil || page < 0 {
		return 0
	}
	return page
}

func getSizeFromQuery(query string) int {
	if query == "" {
		return 20
	}
	size, err := strconv.Atoi(query)
	if err != nil || size < 1 || size > 100 {
		return 20
	}
	return size
}