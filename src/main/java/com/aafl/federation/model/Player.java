package com.aafl.federation.model;

import org.bson.Document;
import java.util.Map;

public class Player {
    private String id;
    private String firstName;
    private String surname;
    private String position;
    private Map<String, Integer> ratings;
    private String teamId;

    public Document toDocument() {
        return new Document()
            .append("firstName", firstName)
            .append("surname", surname)
            .append("position", position)
            .append("ratings", ratings)
            .append("teamId", teamId);
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    
    public Map<String, Integer> getRatings() { return ratings; }
    public void setRatings(Map<String, Integer> ratings) { this.ratings = ratings; }
    
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
}