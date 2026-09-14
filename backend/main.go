package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"time"
)

const (
	apiURL     = "https://api-open.data.gov.sg/v2/real-time/api/psi"
	pm25ApiURL = "https://api-open.data.gov.sg/v2/real-time/api/pm25"
	outputFile = "../frontend/public/data.json"
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

type DerivedReadingsMap map[string]map[string]float64

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
	LastUpdated     string             `json:"lastUpdated"`
	Regions         []RegionMetadata   `json:"regions"`
	Readings        ReadingsMap        `json:"readings"`
	DerivedReadings DerivedReadingsMap `json:"derivedReadings"`
	FetchedAt       string             `json:"fetchedAt"`
}

func concatReadings(mapA, mapB ReadingsMap) ReadingsMap {
	result := make(ReadingsMap)

	// Copy mapA
	for key, subMap := range mapA {
		result[key] = make(map[string]float64)
		for region, val := range subMap {
			result[key][region] = val
		}
	}

	// Overwrite/Add mapB
	for key, subMap := range mapB {
		if _, exists := result[key]; !exists {
			result[key] = make(map[string]float64)
		}
		for region, val := range subMap {
			result[key][region] = val
		}
	}

	return result
}

// For PM2.5 to AQI conversion
type AQIBreakpoint struct {
	cLow, cHigh float64
	iLow, iHigh float64
}

var pm25Breakpoints = []AQIBreakpoint{
	{0.0, 12.0, 0, 50},
	{12.1, 35.4, 51, 100},
	{35.5, 55.4, 101, 150},
	{55.5, 150.4, 151, 200},
	{150.5, 250.4, 201, 300},
	{250.5, 500.4, 301, 500},
}

// PM25ToUSAQI converts PM2.5 concentration (ug/m3) into US AQI integer score
func PM25ToUSAQI(pm25 float64) int {
	// Truncate/round to 1 decimal place per EPA spec
	c := math.Floor(pm25*10) / 10

	if c < 0 {
		return 0
	}
	if c > 500.4 {
		return 500 // Cap at max AQI scale
	}

	for _, bp := range pm25Breakpoints {
		if c >= bp.cLow && c <= bp.cHigh {
			aqi := ((bp.iHigh-bp.iLow)/(bp.cHigh-bp.cLow))*(c-bp.cLow) + bp.iLow
			return int(math.Round(aqi))
		}
	}

	return 0
}

func main() {
	// Read key from environment variable
	apiKey := os.Getenv("GOV_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: GOV_API_KEY environment variable is not set")
		os.Exit(1)
	}

	// Set up request for General PSI Data
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
		fmt.Printf("No items in response.\n")
		os.Exit(1)
	}

	// Extract the relevant data from PSI Response
	regions := apiResponse.Data.Regions
	timestamp := apiResponse.Data.Items[0].Timestamp
	psiReadings := apiResponse.Data.Items[0].Readings

	// Set up request for PM2.5 Data
	client = &http.Client{Timeout: 10 * time.Second}
	request, requestError = http.NewRequest("GET", pm25ApiURL, nil)
	if requestError != nil {
		fmt.Printf("Error creating request: %v\n", requestError)
		os.Exit(1)
	}

	response, responseError = client.Do(request)
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

	responseBody, responseBodyError = io.ReadAll(response.Body)
	if responseBodyError != nil {
		fmt.Printf("Error reading response body: %v\n", responseBodyError)
		os.Exit(1)
	}

	unmarshalError = json.Unmarshal(responseBody, &apiResponse)
	if unmarshalError != nil {
		fmt.Printf("Error unmarshalling JSON: %v\n", unmarshalError)
		os.Exit(1)
	}

	if len(apiResponse.Data.Items) == 0 {
		fmt.Printf("No items in response.\n")
		os.Exit(1)
	}

	// Extract the relevant data from PM2.5 Response
	pm25Readings := apiResponse.Data.Items[0].Readings
	fullReadings := concatReadings(psiReadings, pm25Readings)

	// Logic to convert pm25_one_hourly to US AQI
	derivedReadings := make(DerivedReadingsMap)

	derivedReadings["usaqi_from_pm25_one_hourly"] = make(map[string]float64)
	for region, val := range fullReadings["pm25_one_hourly"] {
		derivedReadings["usaqi_from_pm25_one_hourly"][region] = float64(PM25ToUSAQI(val))
	}

	output := CleanedData{
		LastUpdated:     timestamp,
		Regions:         regions,
		Readings:        fullReadings,
		DerivedReadings: derivedReadings,
		FetchedAt:       time.Now().Format(time.RFC3339),
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
