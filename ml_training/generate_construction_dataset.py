import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

class ConstructionDatasetGenerator:
    def __init__(self):
        self.project_types = ['residential', 'commercial', 'infrastructure', 'industrial']
        self.locations = [
            'New York', 'California', 'Texas', 'Florida', 'Illinois', 'Pennsylvania',
            'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
            'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
            'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama'
        ]
        self.climate_zones = {
            'New York': 'temperate', 'California': 'mediterranean', 'Texas': 'subtropical',
            'Florida': 'tropical', 'Illinois': 'continental', 'Pennsylvania': 'temperate',
            'Ohio': 'continental', 'Georgia': 'subtropical', 'North Carolina': 'subtropical',
            'Michigan': 'continental', 'New Jersey': 'temperate', 'Virginia': 'temperate',
            'Washington': 'oceanic', 'Arizona': 'desert', 'Massachusetts': 'temperate',
            'Tennessee': 'subtropical', 'Indiana': 'continental', 'Missouri': 'continental',
            'Maryland': 'temperate', 'Wisconsin': 'continental', 'Colorado': 'alpine',
            'Minnesota': 'continental', 'South Carolina': 'subtropical', 'Alabama': 'subtropical'
        }
        self.seasons = ['spring', 'summer', 'fall', 'winter']
        self.contractors = [f'Contractor_{i:03d}' for i in range(1, 101)]
        
    def generate_project_characteristics(self):
        """Generate basic project characteristics"""
        project_type = random.choice(self.project_types)
        location = random.choice(self.locations)
        
        # Budget ranges based on project type (realistic industry ranges)
        budget_ranges = {
            'residential': (500000, 5000000),
            'commercial': (2000000, 50000000),
            'infrastructure': (10000000, 500000000),
            'industrial': (5000000, 100000000)
        }
        
        min_budget, max_budget = budget_ranges[project_type]
        budget = random.randint(min_budget, max_budget)
        
        # Duration based on budget and type (realistic construction timelines)
        duration_multipliers = {
            'residential': 0.0001,
            'commercial': 0.00008,
            'infrastructure': 0.00005,
            'industrial': 0.00006
        }
        
        base_duration = int(budget * duration_multipliers[project_type])
        duration_planned = max(30, min(1095, base_duration + random.randint(-30, 60)))
        
        # Complexity score based on budget and type
        complexity_base = {
            'residential': 3,
            'commercial': 5,
            'infrastructure': 8,
            'industrial': 7
        }
        
        complexity_score = min(10, max(1, complexity_base[project_type] + 
                                     int(budget / 10000000) + random.randint(-2, 2)))
        
        return {
            'project_type': project_type,
            'location': location,
            'climate_zone': self.climate_zones[location],
            'project_size_budget': budget,
            'project_duration_planned': duration_planned,
            'project_complexity_score': complexity_score,
            'season_started': random.choice(self.seasons),
            'contractor_id': random.choice(self.contractors)
        }
    
    def generate_progress_metrics(self, project_chars):
        """Generate realistic progress and performance metrics"""
        # Base efficiency influenced by contractor, complexity, and random factors
        contractor_skill = random.uniform(0.7, 0.95)  # Contractor efficiency
        complexity_impact = max(0.5, 1.0 - (project_chars['project_complexity_score'] - 1) * 0.05)
        
        # Progress variance (negative means behind schedule)
        expected_progress_rate = contractor_skill * complexity_impact
        progress_variance = random.normalvariate(-5, 15)  # Realistic delay distribution
        
        # Daily progress velocity
        daily_progress_velocity = max(0.1, expected_progress_rate * random.uniform(0.8, 1.2) / 100)
        
        # Milestone achievement (correlated with overall performance)
        milestone_achievement_rate = max(0.3, min(1.0, 
            expected_progress_rate + random.normalvariate(0, 0.1)))
        
        # Progress consistency (lower is more consistent)
        progress_consistency_score = random.uniform(0.05, 0.25)
        
        return {
            'progress_variance': round(progress_variance, 2),
            'daily_progress_velocity': round(daily_progress_velocity, 4),
            'milestone_achievement_rate': round(milestone_achievement_rate, 3),
            'progress_consistency_score': round(progress_consistency_score, 3)
        }
    
    def generate_resource_factors(self, project_chars):
        """Generate resource utilization and efficiency metrics"""
        # Resource efficiency influenced by project size and complexity
        size_factor = min(1.0, project_chars['project_size_budget'] / 10000000)
        complexity_penalty = project_chars['project_complexity_score'] * 0.02
        
        # Labor utilization efficiency
        labor_efficiency = max(0.5, min(0.98, 
            0.85 + size_factor * 0.1 - complexity_penalty + random.normalvariate(0, 0.08)))
        
        # Material shortage frequency (days with shortages / total days)
        material_shortage_freq = max(0, min(0.4,
            complexity_penalty + np.random.exponential(0.05)))
        
        # Equipment availability ratio
        equipment_availability = max(0.6, min(0.99, 
            0.9 - complexity_penalty + random.normalvariate(0, 0.05)))
        
        # Resource cost variance (actual vs planned)
        resource_cost_variance = random.normalvariate(5, 10)  # % variance
        
        return {
            'labor_utilization_efficiency': round(labor_efficiency, 3),
            'material_shortage_frequency': round(material_shortage_freq, 3),
            'equipment_availability_ratio': round(equipment_availability, 3),
            'resource_cost_variance': round(resource_cost_variance, 2)
        }
    
    def generate_external_factors(self, project_chars):
        """Generate weather, regulatory, and supply chain factors"""
        # Weather impact based on climate zone and season
        climate_weather_impact = {
            'tropical': {'spring': 8, 'summer': 15, 'fall': 12, 'winter': 5},
            'subtropical': {'spring': 6, 'summer': 12, 'fall': 8, 'winter': 4},
            'temperate': {'spring': 10, 'summer': 8, 'fall': 12, 'winter': 18},
            'continental': {'spring': 12, 'summer': 10, 'fall': 15, 'winter': 25},
            'mediterranean': {'spring': 4, 'summer': 2, 'fall': 8, 'winter': 12},
            'oceanic': {'spring': 15, 'summer': 8, 'fall': 18, 'winter': 22},
            'desert': {'spring': 3, 'summer': 8, 'fall': 2, 'winter': 5},
            'alpine': {'spring': 20, 'summer': 12, 'fall': 25, 'winter': 35}
        }
        
        base_weather_days = climate_weather_impact[project_chars['climate_zone']][project_chars['season_started']]
        weather_impact_days = max(0, int(base_weather_days + random.normalvariate(0, 5)))
        weather_severity_score = random.uniform(3, 8)
        
        # Supply chain disruptions (more common for complex/large projects)
        supply_disruption_prob = (project_chars['project_complexity_score'] / 10) * 0.3
        supply_chain_disruption_days = np.random.poisson(supply_disruption_prob * 10)
        
        # Regulatory delays (more common for infrastructure and industrial)
        regulatory_multiplier = {'residential': 0.5, 'commercial': 1.0, 
                               'infrastructure': 2.0, 'industrial': 1.5}
        reg_base = regulatory_multiplier[project_chars['project_type']]
        regulatory_delay_days = max(0, int(np.random.poisson(reg_base * 3)))
        
        return {
            'weather_impact_days': weather_impact_days,
            'weather_severity_score': round(weather_severity_score, 2),
            'supply_chain_disruption_days': supply_chain_disruption_days,
            'regulatory_delay_days': regulatory_delay_days
        }
    
    def generate_financial_metrics(self, project_chars, progress_metrics, resource_factors):
        """Generate budget and cost-related metrics"""
        # Budget burn rate influenced by efficiency and progress
        efficiency_factor = (resource_factors['labor_utilization_efficiency'] + 
                           resource_factors['equipment_availability_ratio']) / 2
        
        budget_burn_rate = max(0.8, min(1.5, 
            1.0 / efficiency_factor + random.normalvariate(0, 0.1)))
        
        # Cash flow consistency
        cash_flow_consistency = random.uniform(0.02, 0.15)
        
        # Cost overrun percentage
        cost_overrun_base = (1 - efficiency_factor) * 20
        cost_overrun_percentage = max(-5, cost_overrun_base + random.normalvariate(0, 8))
        
        return {
            'budget_burn_rate': round(budget_burn_rate, 3),
            'cash_flow_consistency': round(cash_flow_consistency, 3),
            'cost_overrun_percentage': round(cost_overrun_percentage, 2)
        }
    
    def generate_quality_metrics(self, project_chars, resource_factors):
        """Generate quality and safety metrics"""
        # Quality issues influenced by resource efficiency and complexity
        quality_base = (1 - resource_factors['labor_utilization_efficiency']) * 0.2
        complexity_impact = project_chars['project_complexity_score'] * 0.01
        
        rework_frequency = max(0, quality_base + complexity_impact + np.random.exponential(0.02))
        inspection_failure_rate = max(0, min(0.5, rework_frequency * 2 + random.normalvariate(0, 0.05)))
        safety_incident_count = max(0, int(np.random.poisson(
            project_chars['project_complexity_score'] * 0.3)))
        
        return {
            'rework_frequency': round(rework_frequency, 3),
            'inspection_failure_rate': round(inspection_failure_rate, 3),
            'safety_incident_count': safety_incident_count
        }
    
    def calculate_actual_delay(self, all_metrics):
        """Calculate realistic delay based on all factors"""
        # Delay influenced by multiple factors with realistic weights
        delay_factors = {
            'progress_variance': all_metrics['progress_variance'] * 0.3,
            'resource_efficiency': (1 - all_metrics['labor_utilization_efficiency']) * 30,
            'material_shortages': all_metrics['material_shortage_frequency'] * 25,
            'weather_impact': all_metrics['weather_impact_days'] * 0.8,
            'supply_disruption': all_metrics['supply_chain_disruption_days'] * 1.2,
            'regulatory_delays': all_metrics['regulatory_delay_days'] * 1.0,
            'quality_issues': all_metrics['rework_frequency'] * 40,
            'complexity_penalty': all_metrics['project_complexity_score'] * 2
        }
        
        total_delay_score = sum(delay_factors.values())
        
        # Add some randomness and ensure realistic bounds
        actual_delay = max(0, int(total_delay_score + random.normalvariate(0, 5)))
        
        # Cap delays at reasonable maximums based on project duration
        max_delay = all_metrics['project_duration_planned'] * 0.5
        actual_delay = min(actual_delay, max_delay)
        
        return actual_delay
    
    def generate_contractor_performance(self, contractor_id):
        """Generate consistent contractor performance metrics"""
        # Each contractor has consistent performance characteristics
        contractor_hash = hash(contractor_id) % 1000
        performance_score = 5 + (contractor_hash % 6) + random.normalvariate(0, 0.5)
        performance_score = max(1, min(10, performance_score))
        
        return {
            'contractor_past_performance_score': round(performance_score, 2)
        }
    
    def generate_regional_metrics(self, location):
        """Generate location-based construction performance metrics"""
        # Regional construction performance index
        regional_indices = {
            'New York': 0.85, 'California': 0.82, 'Texas': 0.88, 'Florida': 0.86,
            'Illinois': 0.87, 'Pennsylvania': 0.86, 'Ohio': 0.89, 'Georgia': 0.87,
            'North Carolina': 0.88, 'Michigan': 0.85, 'New Jersey': 0.84, 'Virginia': 0.87,
            'Washington': 0.83, 'Arizona': 0.89, 'Massachusetts': 0.82, 'Tennessee': 0.88,
            'Indiana': 0.89, 'Missouri': 0.88, 'Maryland': 0.85, 'Wisconsin': 0.87,
            'Colorado': 0.86, 'Minnesota': 0.87, 'South Carolina': 0.88, 'Alabama': 0.89
        }
        
        regional_index = regional_indices.get(location, 0.87)
        similar_project_avg_delay = random.normalvariate(15, 8) * (1 / regional_index)
        
        return {
            'regional_construction_index': round(regional_index, 3),
            'similar_project_avg_delay': round(max(0, similar_project_avg_delay), 2)
        }
    
    def generate_single_project(self, project_id):
        """Generate a complete realistic project record"""
        # Generate all components
        project_chars = self.generate_project_characteristics()
        progress_metrics = self.generate_progress_metrics(project_chars)
        resource_factors = self.generate_resource_factors(project_chars)
        external_factors = self.generate_external_factors(project_chars)
        financial_metrics = self.generate_financial_metrics(project_chars, progress_metrics, resource_factors)
        quality_metrics = self.generate_quality_metrics(project_chars, resource_factors)
        contractor_metrics = self.generate_contractor_performance(project_chars['contractor_id'])
        regional_metrics = self.generate_regional_metrics(project_chars['location'])
        
        # Combine all metrics
        all_metrics = {
            **project_chars,
            **progress_metrics,
            **resource_factors,
            **external_factors,
            **financial_metrics,
            **quality_metrics,
            **contractor_metrics,
            **regional_metrics
        }
        
        # Calculate target variable (actual delay)
        actual_delay = self.calculate_actual_delay(all_metrics)
        all_metrics['actual_delay_days'] = actual_delay
        
        # Add project ID
        all_metrics['project_id'] = f'PROJ_{project_id:05d}'
        
        return all_metrics
    
    def generate_dataset(self, num_projects=2000):
        """Generate complete dataset"""
        print(f"Generating {num_projects} realistic construction projects...")
        
        projects = []
        for i in range(1, num_projects + 1):
            if i % 100 == 0:
                print(f"Generated {i} projects...")
            
            project = self.generate_single_project(i)
            projects.append(project)
        
        df = pd.DataFrame(projects)
        
        # Reorder columns for better readability
        column_order = [
            'project_id', 'project_type', 'location', 'climate_zone', 'season_started',
            'project_size_budget', 'project_duration_planned', 'project_complexity_score',
            'progress_variance', 'daily_progress_velocity', 'milestone_achievement_rate', 'progress_consistency_score',
            'labor_utilization_efficiency', 'material_shortage_frequency', 'equipment_availability_ratio', 'resource_cost_variance',
            'weather_impact_days', 'weather_severity_score', 'supply_chain_disruption_days', 'regulatory_delay_days',
            'budget_burn_rate', 'cash_flow_consistency', 'cost_overrun_percentage',
            'rework_frequency', 'inspection_failure_rate', 'safety_incident_count',
            'contractor_past_performance_score', 'regional_construction_index', 'similar_project_avg_delay',
            'actual_delay_days'
        ]
        
        df = df[column_order]
        
        print(f"\nDataset generated successfully!")
        print(f"Shape: {df.shape}")
        print(f"Average delay: {df['actual_delay_days'].mean():.1f} days")
        print(f"Delay range: {df['actual_delay_days'].min()} - {df['actual_delay_days'].max()} days")
        
        return df

if __name__ == "__main__":
    generator = ConstructionDatasetGenerator()
    dataset = generator.generate_dataset(2000)
    
    # Save dataset
    dataset.to_csv('construction_delay_dataset.csv', index=False)
    print(f"\nDataset saved as 'construction_delay_dataset.csv'")
    
    # Display sample data
    print("\nSample data:")
    print(dataset.head())
    
    # Display statistics
    print("\nDataset Statistics:")
    print(dataset.describe())
