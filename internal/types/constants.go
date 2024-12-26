package types

const (
	GameStatus_Playing   = 0
	GameStatus_Played    = 1
	GameStatus_Planned   = 2
	GameStatus_Abandoned = 3
	GameStatus_OnHold    = 4
	GameStatus_Completed = 5
	GameStatus_Skipped   = 6
	GameStatus_Banned    = 7
)

const (
	GameNoteCompletionStatus_Finished   = 0
	GameNoteCompletionStatus_Unfinished = 1
	GameNoteCompletionStatus_Endless    = 2
)

// Payment Type
const (
	PaymentType_None           = 0
	PaymentType_Pickle         = 1
	PaymentType_TwitchPoints   = 2
	PaymentType_DonationAlerts = 3
	PaymentType_DonatePay      = 4
	PaymentType_StreamElements = 5
	PaymentType_StreamLabs     = 6
)

// Order Status
const (
	OrderStatus_Reviewing = 0
	OrderStatus_Approved  = 1
	OrderStatus_Denied    = 2
)

const (
	Category_Custom = 0
	Category_Game   = 1
	Category_Anime  = 2
	Category_Movie  = 3
	Category_Series = 4
	Category_Video  = 5
)
