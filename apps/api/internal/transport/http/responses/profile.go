package responses

import "time"

// Response/view models for Profile resources. These are the API contract.

type ProfileCounts struct {
	Played    int64 `json:"played"`
	Watched   int64 `json:"watched"`
	Ordered   int64 `json:"ordered"`
	Followers int64 `json:"followers"`
}

type Profile struct {
	DetailedUser
	CreatedAt time.Time     `json:"createdAt"`
	Counts    ProfileCounts `json:"counts"`
}
