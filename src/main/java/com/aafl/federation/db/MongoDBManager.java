package com.aafl.federation.db;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import java.io.InputStream;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

public class MongoDBManager {
    private static MongoDBManager instance;
    private final MongoClient mongoClient;
    private final MongoDatabase database;
    private static final Logger logger = Logger.getLogger(MongoDBManager.class.getName());

    private MongoDBManager() {
        Properties config = new Properties();
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("config.properties")) {
            if (input == null) {
                throw new RuntimeException("Unable to find config.properties");
            }
            config.load(input);
            
            String uri = config.getProperty("mongodb.uri");
            String dbName = config.getProperty("mongodb.database");
            
            // Connect to MongoDB Atlas
            mongoClient = MongoClients.create(uri);
            database = mongoClient.getDatabase(dbName);
            
            // Initialize collections
            try {
                database.createCollection("teams");
                database.createCollection("players");
                
                // Create indexes for faster queries
                getTeamsCollection().createIndex(new Document("teamName", 1));
                getPlayersCollection().createIndex(new Document("teamId", 1));
            } catch (Exception e) {
                // Collections might already exist, that's okay
                logger.log(Level.INFO, "Collections already exist", e);
            }
            
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error initializing MongoDB connection", e);
            throw new RuntimeException("Failed to initialize MongoDB connection", e);
        }
    }

    public static synchronized MongoDBManager getInstance() {
        if (instance == null) {
            instance = new MongoDBManager();
        }
        return instance;
    }

    public MongoCollection<Document> getTeamsCollection() {
        return database.getCollection("teams");
    }

    public MongoCollection<Document> getPlayersCollection() {
        return database.getCollection("players");
    }

    public void close() {
        if (mongoClient != null) {
            mongoClient.close();
        }
    }
}