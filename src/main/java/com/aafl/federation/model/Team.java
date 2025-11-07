package com.aafl.federation.model;

import org.bson.Document;
import java.util.List;
import java.util.Map;

public class Team {
    private String id;
    private String fedRepName;
    private String countryName;
    private String teamName;
    private String managerName;
    private String captainName;
    private List<Player> players;

    public Document toDocument() {
        return new Document()
            .append("fedRepName", fedRepName)
            .append("countryName", countryName)
            .append("teamName", teamName)
            .append("managerName", managerName)
            .append("captainName", captainName);
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFedRepName() { return fedRepName; }
    public void setFedRepName(String fedRepName) { this.fedRepName = fedRepName; }
    
    public String getCountryName() { return countryName; }
    public void setCountryName(String countryName) { this.countryName = countryName; }
    
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    
    public String getCaptainName() { return captainName; }
    public void setCaptainName(String captainName) { this.captainName = captainName; }
    
    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }
}