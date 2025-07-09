// Mock data for when database is not available
const mockVehicles = [
    {
        vehicleId: 'KA01AB1234',
        driverName: 'John Smith',
        lat: 12.9716,
        lng: 77.5946,
        status: 'on_route',
        wasteType: 'organic',
        route: { 
            ward: 'Ward 12', 
            area: 'Residential Area', 
            completedStops: 24, 
            totalStops: 30 
        },
        capacity: { current: 65, maximum: 100 },
        lastUpdate: new Date(),
        schedule: {
            startTime: new Date(),
            estimatedEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000)
        }
    },
    {
        vehicleId: 'KA01CD5678',
        driverName: 'Mike Johnson',
        lat: 12.9800,
        lng: 77.6000,
        status: 'collecting',
        wasteType: 'recyclable',
        route: { 
            ward: 'Ward 8', 
            area: 'Commercial Area', 
            completedStops: 12, 
            totalStops: 20 
        },
        capacity: { current: 40, maximum: 100 },
        lastUpdate: new Date(),
        schedule: {
            startTime: new Date(),
            estimatedEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
        }
    },
    {
        vehicleId: 'KA01EF9012',
        driverName: 'Sarah Wilson',
        lat: 12.9500,
        lng: 77.5800,
        status: 'completed',
        wasteType: 'hazardous',
        route: { 
            ward: 'Ward 5', 
            area: 'Industrial Area', 
            completedStops: 15, 
            totalStops: 15 
        },
        capacity: { current: 90, maximum: 100 },
        lastUpdate: new Date(),
        schedule: {
            startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
            estimatedEndTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
            actualEndTime: new Date(Date.now() - 30 * 60 * 1000)
        }
    }
];

const mockSchedules = [
    { 
        day: 'Monday', 
        time: '7:00 AM - 12:45 PM', 
        type: 'Organic Waste',
        description: 'Kitchen waste, food scraps, garden waste'
    },
    { 
        day: 'Wednesday', 
        time: '7:00 AM - 12:45 PM', 
        type: 'Recyclables',
        description: 'Paper, plastic, glass, metal containers'
    },
    { 
        day: 'Friday', 
        time: '7:00 AM - 12:00 PM', 
        type: 'Hazardous Waste',
        description: 'Batteries, electronics, chemicals'
    },
    { 
        day: 'Saturday', 
        time: '8:00 AM - 11:00 AM', 
        type: 'General Waste',
        description: 'Non-recyclable household waste'
    }
];

module.exports = {
    mockVehicles,
    mockSchedules
};