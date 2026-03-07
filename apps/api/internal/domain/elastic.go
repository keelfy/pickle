package domain

type ElasticContent struct {
	Popularity   float64      `json:"popularity"`
	ImageKey     *string      `json:"image_key"`
	ImageKeyType ImageKeyType `json:"image_key_type"`
	EnglishName  string       `json:"name_en"`
	RussianName  string       `json:"name_ru"`
	GermanName   string       `json:"name_de"`
	SpanishName  string       `json:"name_es"`
}
