package requests

type Reaction struct {
	EmoteID string `json:"emoteId"`
	Source  string `json:"source"`
}
