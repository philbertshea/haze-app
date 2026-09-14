package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	apiURL     = "https://api-open.data.gov.sg/v2/real-time/api/psi"
	outputFile = "data.json"
)

type RegionMetadata struct {
	Name          string `json:"name"`
	LabelLocation struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"labelLocation"`
}

// E.g. readings["pm25_sub_index"]["north"] = 100
type ReadingsMap map[string]map[string]float64

type Item struct {
	Date             string      `json:"date"`
	UpdatedTimestamp string      `json:"updatedTimestamp"`
	Timestamp        string      `json:"timestamp"`
	Readings         ReadingsMap `json:"readings"`
}

type ApiResponse struct {
	Code int `json:"code"`
	Data struct {
		Regions []RegionMetadata `json:"regionMetadata"`
		Items   []Item           `json:"items"`
	}
	ErrorMessage string `json:"errorMsg"`
}

type CleanedData struct {
	LastUpdated string           `json:"lastUpdated"`
	Regions     []RegionMetadata `json:"regions"`
	Readings    ReadingsMap      `json:"readings"`
	FetchedAt   string           `json:"fetchedAt"`
}

func main() {
	// Read key from environment variable
	apiKey := os.Getenv("GOV_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: GOV_API_KEY environment variable is not set")
		os.Exit(1)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	request, requestError := http.NewRequest("GET", apiURL, nil)
	if requestError != nil {
		fmt.Printf("Error creating request: %v\n", requestError)
		os.Exit(1)
	}

	response, responseError := client.Do(request)
	if responseError != nil {
		fmt.Printf("Error creating request: %v\n", requestError)
		os.Exit(1)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(response.Body)
		fmt.Printf("API returned status %d: %s\n", response.StatusCode, string(body))
		os.Exit(1)
	}

	responseBody, responseBodyError := io.ReadAll(response.Body)
	if responseBodyError != nil {
		fmt.Printf("Error reading response body: %v\n", responseBodyError)
		os.Exit(1)
	}

	var apiResponse ApiResponse
	unmarshalError := json.Unmarshal(responseBody, &apiResponse)
	if unmarshalError != nil {
		fmt.Printf("Error unmarshalling JSON: %v\n", unmarshalError)
		os.Exit(1)
	}

	if len(apiResponse.Data.Items) == 0 {
		fmt.Printf("Mp items in response.\n")
		os.Exit(1)
	}

	// Only want the latest data Item
	latestItem := apiResponse.Data.Items[0]

	output := CleanedData{
		LastUpdated: latestItem.UpdatedTimestamp,
		Regions:     apiResponse.Data.Regions,
		Readings:    latestItem.Readings,
		FetchedAt:   time.Now().Format(time.RFC3339),
	}

	// Convert data structure into json byte slice
	fileData, err := json.MarshalIndent(output, "", "	")
	if err != nil {
		fmt.Printf("Error encoding output JSON: %v\n", err)
		os.Exit(1)
	}

	// Write to output file: 0644 means users can read and write, but group/others only
	if err := os.WriteFile(outputFile, fileData, 0644); err != nil {
		fmt.Printf("Error writing to %s: %v\n", outputFile, err)
		os.Exit(1)
	}

	fmt.Printf("Successfully updated %s at %s\n", outputFile, output.FetchedAt)

}
