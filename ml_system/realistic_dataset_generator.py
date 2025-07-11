#!/usr/bin/env python3
"""
Realistic Construction Dataset Generator
Based on actual construction project patterns and real-world data
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import random

def generate_realistic_construction_dataset(num_projects=1000):
    """
    Generate realistic construction dataset based on actual project patterns
    """
    
    # Real construction project types and their characteristics
    project_types = {
        'residential_building': {
            'avg_budget': 2500000,
            'avg_duration': 180,
            'complexity_factor': 1.0,
            'weather_sensitivity': 0.7
        },
        'commercial_building': {
            'avg_budget': 8500000,
            'avg_duration': 365,
            'complexity_factor': 1.5,
            'weather_sensitivity': 0.6
        },
        'highway_construction': {
            'avg_budget': 15000000,
            'avg_duration': 540,
            'complexity_factor': 2.0,
            'weather_sensitivity': 0.9
        },
        'bridge_construction': {
            'avg_budget': 25000000,
            'avg_duration': 720,
            'complexity_factor': 2.5,
            'weather_sensitivity': 0.8
        },
        'industrial_facility': {
            'avg_budget': 45000000,
            'avg_duration': 900,
            'complexity_factor': 3.0,
            'weather_sensitivity': 0.5
        }
    }
    
    # Real locations with weather patterns
    locations = {
        'Delhi': {'weather_risk': 0.8, 'labor_availability': 0.9, 'material_cost_factor': 1.0},
        'Mumbai': {'weather_risk': 0.9, 'labor_availability': 0.8, 'material_cost_factor': 1.1},
        'Bangalore': {'weather_risk': 0.6, 'labor_availability': 0.9, 'material_cost_factor': 1.05},
        'Chennai': {'weather_risk': 0.8, 'labor_availability': 0.8, 'material_cost_factor': 1.0},
        'Kolkata': {'weather_risk': 0.9, 'labor_availability': 0.7, 'material_cost_factor': 0.95},
        'Hyderabad': {'weather_risk': 0.7, 'labor_availability': 0.8, 'material_cost_factor': 1.0},
        'Pune': {'weather_risk': 0.7, 'labor_availability': 0.9, 'material_cost_factor': 1.05},
        'Ahmedabad': {'weather_risk': 0.8, 'labor_availability': 0.8, 'material_cost_factor': 0.98}
    }
    
    projects = []
    
    for i in range(num_projects):
        # Select project type and location
        project_type = random.choice(list(project_types.keys()))
        location = random.choice(list(locations.keys()))
        
        type_data = project_types[project_type]
        location_data = locations[location]
        
        # Generate base project parameters
        budget = type_data['avg_budget'] * random.uniform(0.7, 1.5)
        planned_duration = type_data['avg_duration'] * random.uniform(0.8, 1.3)
        
        # Calculate realistic features based on project characteristics
        
        # 1. Progress Efficiency (0-1): How efficiently the project progresses
        base_efficiency = random.uniform(0.6, 1.0)
        progress_efficiency = base_efficiency * location_data['labor_availability']
        
        # 2. Resource Availability (0-1): Overall resource availability
        resource_availability = (
            location_data['labor_availability'] * 0.4 +
            random.uniform(0.7, 1.0) * 0.3 +  # Material availability
            random.uniform(0.6, 0.95) * 0.3    # Equipment availability
        )
        
        # 3. Project Complexity (0-1): Based on budget, type, and resource count
        budget_complexity = min(1.0, budget / 50000000)  # Normalize to 50M max
        project_complexity = (
            type_data['complexity_factor'] * 0.4 +
            budget_complexity * 0.3 +
            random.uniform(0.5, 1.0) * 0.3  # Random complexity factors
        ) / 3.0
        
        # 4. Weather Impact (0-1): Seasonal and location-based weather risk
        seasonal_factor = random.uniform(0.5, 1.0)  # Simulate seasonal variation
        weather_impact = (
            location_data['weather_risk'] * 0.6 +
            type_data['weather_sensitivity'] * 0.4
        ) * seasonal_factor
        
        # 5. Timeline Pressure (0-1): How much pressure is on the timeline
        current_progress = random.uniform(0.1, 0.9)
        time_elapsed = random.uniform(0.1, 0.8)
        expected_progress = time_elapsed
        progress_variance = current_progress - expected_progress
        timeline_pressure = max(0, -progress_variance) + (0.3 if time_elapsed > 0.7 else 0)
        timeline_pressure = min(1.0, timeline_pressure)
        
        # Calculate realistic delay (target variable)
        # Base delay calculation using realistic factors
        delay_factors = {
            'progress_inefficiency': max(0, 1 - progress_efficiency) * 30,
            'resource_shortage': max(0, 1 - resource_availability) * 25,
            'complexity_overhead': project_complexity * 20,
            'weather_delays': weather_impact * 15,
            'timeline_pressure_penalty': timeline_pressure * 10
        }
        
        base_delay = sum(delay_factors.values())
        
        # Add realistic randomness and constraints
        random_factor = random.uniform(0.7, 1.4)
        actual_delay = max(0, base_delay * random_factor)
        
        # Cap delays at reasonable maximums based on project duration
        max_reasonable_delay = planned_duration * 0.5  # Max 50% delay
        actual_delay = min(actual_delay, max_reasonable_delay)
        
        # Calculate additional cost (realistic cost escalation)
        daily_cost = budget / planned_duration
        cost_escalation_rate = 1.2  # 20% cost escalation for delays
        additional_cost = actual_delay * daily_cost * cost_escalation_rate
        
        project = {
            'project_id': f'PROJ_{i+1:04d}',
            'project_type': project_type,
            'location': location,
            'budget': round(budget, 2),
            'planned_duration_days': round(planned_duration),
            'current_progress_pct': round(current_progress * 100, 1),
            'time_elapsed_pct': round(time_elapsed * 100, 1),
            
            # ML Features (0-1 scale)
            'progress_efficiency': round(progress_efficiency, 3),
            'resource_availability': round(resource_availability, 3),
            'project_complexity': round(project_complexity, 3),
            'weather_impact': round(weather_impact, 3),
            'timeline_pressure': round(timeline_pressure, 3),
            
            # Target variables
            'delay_days': round(actual_delay, 1),
            'additional_cost_usd': round(additional_cost, 2),
            
            # Additional context
            'progress_variance': round(progress_variance, 3),
            'labor_availability': location_data['labor_availability'],
            'weather_risk_location': location_data['weather_risk'],
            'material_cost_factor': location_data['material_cost_factor']
        }
        
        projects.append(project)
    
    return pd.DataFrame(projects)

def save_dataset(df, filename='realistic_construction_dataset.csv'):
    """Save the dataset to CSV file"""
    df.to_csv(filename, index=False)
    print(f"Dataset saved to {filename}")
    print(f"Dataset shape: {df.shape}")
    print(f"Average delay: {df['delay_days'].mean():.1f} days")
    print(f"Average additional cost: ${df['additional_cost_usd'].mean():,.0f}")
    
    # Print feature correlations with delay
    print("\nFeature correlations with delay:")
    features = ['progress_efficiency', 'resource_availability', 'project_complexity', 
                'weather_impact', 'timeline_pressure']
    for feature in features:
        corr = df[feature].corr(df['delay_days'])
        print(f"{feature}: {corr:.3f}")

if __name__ == "__main__":
    print("Generating realistic construction dataset...")
    df = generate_realistic_construction_dataset(2000)
    save_dataset(df)
    
    # Show sample data
    print("\nSample data:")
    print(df.head())
