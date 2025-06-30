package main

import (
	"regexp"
	"strings"

	"github.com/sirupsen/logrus"
)

// Username validation patterns
var (
	// Valid username pattern: 1-64 characters, alphanumeric plus hyphens, no leading/trailing hyphens
	validUsernameRegex = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$`)
	
	// Common attack patterns to block immediately
	attackPatterns = []string{
		".php", ".asp", ".aspx", ".jsp", ".cgi", ".pl", ".py", ".rb",
		".html", ".htm", ".xml", ".json", ".txt", ".log", ".bak",
		"admin", "administrator", "root", "test", "guest", "user",
		"wp-", "wordpress", "drupal", "joomla", "phpmyadmin",
		"config", "backup", "database", "db", "sql", "ftp",
		"mail", "email", "webmail", "cpanel", "whm",
		"api", "rest", "graphql", "swagger",
		"login", "signin", "auth", "oauth", "sso",
		"robots.txt", "sitemap.xml", "favicon.ico",
		".", "..", "~", "@", "#", "$", "%", "^", "&", "*",
		"(", ")", "[", "]", "{", "}", "<", ">", "|", "\\", "/",
		"'", "\"", "`", "=", "+", "?", "!", ";", ":",
	}
	
	// Suspicious user agents (case-insensitive)
	suspiciousUserAgents = []string{
		"bot", "crawler", "spider", "scraper", "scanner",
		"curl", "wget", "python", "perl", "ruby", "php",
		"postman", "insomnia", "httpie",
		"nmap", "masscan", "zmap", "sqlmap",
		"nikto", "dirb", "gobuster", "dirbuster",
		"burp", "owasp", "zap",
	}
)

// RequestClassification represents the type of request
type RequestClassification string

const (
	ClassificationLegitimate RequestClassification = "legitimate"
	ClassificationBot        RequestClassification = "bot"
	ClassificationSuspicious RequestClassification = "suspicious"
	ClassificationAttack     RequestClassification = "attack"
)

// ValidateUsername checks if a username is valid for the crates platform
func ValidateUsername(username string) (bool, RequestClassification, string) {
	// Check length
	if len(username) == 0 {
		return false, ClassificationSuspicious, "empty username"
	}
	
	if len(username) > 64 {
		return false, ClassificationSuspicious, "username too long"
	}
	
	// Convert to lowercase for pattern matching
	lowerUsername := strings.ToLower(username)
	
	// Check for attack patterns
	for _, pattern := range attackPatterns {
		if strings.Contains(lowerUsername, pattern) {
			return false, ClassificationAttack, "contains attack pattern: " + pattern
		}
	}
	
	// Check against valid username regex
	if !validUsernameRegex.MatchString(username) {
		return false, ClassificationSuspicious, "invalid username format"
	}
	
	return true, ClassificationLegitimate, ""
}

// ClassifyUserAgent determines if a user agent looks suspicious
func ClassifyUserAgent(userAgent string) RequestClassification {
	if userAgent == "" {
		return ClassificationSuspicious
	}
	
	lowerUA := strings.ToLower(userAgent)
	
	for _, suspicious := range suspiciousUserAgents {
		if strings.Contains(lowerUA, suspicious) {
			return ClassificationBot
		}
	}
	
	return ClassificationLegitimate
}

// ClassifyRequest performs overall request classification
func ClassifyRequest(username, userAgent, uri string) RequestClassification {
	// Check username validity
	isValid, usernameClass, reason := ValidateUsername(username)
	if !isValid {
		logrus.WithFields(logrus.Fields{
			"username": username,
			"classification": usernameClass,
			"reason": reason,
			"userAgent": userAgent,
			"uri": uri,
		}).Debug("Invalid username detected")
		return usernameClass
	}
	
	// Check user agent
	uaClass := ClassifyUserAgent(userAgent)
	if uaClass != ClassificationLegitimate {
		return uaClass
	}
	
	return ClassificationLegitimate
}

// ShouldBlockRequest determines if a request should be blocked early
func ShouldBlockRequest(classification RequestClassification) bool {
	return classification == ClassificationAttack || classification == ClassificationSuspicious
}

// ShouldReduceLogging determines if logging should be reduced for this request
func ShouldReduceLogging(classification RequestClassification) bool {
	return classification == ClassificationBot || classification == ClassificationAttack
}