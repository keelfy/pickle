package models

import db "github.com/pickle.pw/monolith/db/sqlc"

type BasicElasticContent struct {
	Popularity   float64         `json:"popularity"`
	ImageKey     *string         `json:"image_key"`
	ImageKeyType db.ImageKeyType `json:"image_key_type"`
	EnglishName  string          `json:"name_en"`
	RussianName  string          `json:"name_ru"`
	GermanName   string          `json:"name_de"`
	SpanishName  string          `json:"name_es"`
}
