'use client';

import { useState, useEffect } from 'react';
import { RoutingService, Route, PickupLocation, RouteOptimization } from '@/services/routingService';

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [optimization, setOptimization] = useState<RouteOptimization | null>(null);
  const [stats, setStats] = useState<any>({});
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = () => {
    const routeData = RoutingService.getRoutesByDate(currentDate);
    setRoutes(routeData);
    setActiveRoute(RoutingService.getTodaysActiveRoute());
    setStats(RoutingService.getRouteStats());
  };

  const handleOptimizeRoute = async (route: Route) => {
    const optimized = await RoutingService.optimizeRoute(route.pickups.map(p => ({
      id: p.id,
      address: p.address,
      timeWindow: p.timeWindow,
      priority: p.priority,
      deviceValue: p.deviceValue
    })));
    setOptimization(optimized);
    setSelectedRoute(route);
  };

  const handleUpdatePickupStatus = (pickupId: string, status: PickupLocation['status']) => {
    RoutingService.updatePickupStatus(pickupId, status);
    loadData();
  };

  const getStatusColor = (status: PickupLocation['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'en_route': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: PickupLocation['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour);
    const isPM = hourNum >= 12;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  };

  const getNextPickup = (route: Route): PickupLocation | null => {
    return route.pickups.find(p => p.status === 'en_route') || 
           route.pickups.find(p => p.status === 'pending') || null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{stats.activeRoutes || 0}</div>
          <div className="text-sm text-blue-700">Active Routes</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">{stats.activePickups || 0}</div>
          <div className="text-sm text-orange-700">Active Pickups</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{stats.completedPickups || 0}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">{stats.completionRate || 0}%</div>
          <div className="text-sm text-purple-700">Success Rate</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.averageDistance || 0}km</div>
          <div className="text-sm text-gray-700">Avg Distance</div>
        </div>
      </div>

      {/* Current Active Route */}
      {activeRoute && (
        <div className="bg-white border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">🚗 Active Route</h3>
                <p className="text-sm text-gray-600">
                  {activeRoute.pickups.length} pickups • {activeRoute.estimatedDistance}km • 
                  ${activeRoute.totalValue.toLocaleString()} total value
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-700">
                  {activeRoute.pickups.filter(p => p.status === 'completed').length} / {activeRoute.pickups.length} completed
                </div>
                <div className="text-xs text-gray-500">
                  ETA: {activeRoute.estimatedDuration}min
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Next Pickup */}
            {(() => {
              const nextPickup = getNextPickup(activeRoute);
              return nextPickup && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">📍 Next Pickup</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>{nextPickup.customerName}</strong> • {formatTime(nextPickup.timeWindow.start)}</div>
                        <div className="text-gray-600">{nextPickup.address}</div>
                        <div className="flex items-center space-x-4">
                          <span className="text-green-600 font-medium">${nextPickup.deviceValue}</span>
                          <span className={`text-xs font-medium ${getPriorityColor(nextPickup.priority)}`}>
                            {nextPickup.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        {nextPickup.notes && (
                          <div className="text-xs bg-white px-2 py-1 rounded border">
                            💭 {nextPickup.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <a
                        href={RoutingService.getNavigationUrl(nextPickup.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 text-center"
                      >
                        🗺️ Navigate
                      </a>
                      <a
                        href={`tel:${nextPickup.phone}`}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 text-center"
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/61${nextPickup.phone.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 text-center"
                      >
                        💬 SMS
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    {nextPickup.status === 'pending' && (
                      <button
                        onClick={() => handleUpdatePickupStatus(nextPickup.id, 'en_route')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
                      >
                        ✈️ Start Journey
                      </button>
                    )}
                    {nextPickup.status === 'en_route' && (
                      <button
                        onClick={() => handleUpdatePickupStatus(nextPickup.id, 'arrived')}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700"
                      >
                        📍 Mark Arrived
                      </button>
                    )}
                    {nextPickup.status === 'arrived' && (
                      <button
                        onClick={() => handleUpdatePickupStatus(nextPickup.id, 'completed')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                      >
                        ✅ Complete Pickup
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* All Pickups List */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">All Pickups</h4>
              {activeRoute.pickups.map((pickup, index) => (
                <div key={pickup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{pickup.customerName}</div>
                      <div className="text-xs text-gray-600">{pickup.address.split(',')[0]}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(pickup.timeWindow.start)} • ${pickup.deviceValue}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(pickup.status)}`}>
                      {pickup.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(pickup.priority)}`}>
                      {pickup.priority === 'high' ? '🔥' : pickup.priority === 'medium' ? '⚠️' : '📝'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Route Planning */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Route Planning</h3>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">📅</p>
              <p className="mt-2">No routes scheduled for {new Date(currentDate).toLocaleDateString('en-AU')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Route {route.id.split('_')[1]}</h4>
                      <p className="text-sm text-gray-600">
                        {route.pickups.length} pickups • {route.estimatedDistance}km • 
                        {route.estimatedDuration}min • ${route.totalValue.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          route.status === 'active' ? 'bg-green-100 text-green-800' :
                          route.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {route.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOptimizeRoute(route)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
                      >
                        🎯 Optimize
                      </button>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-700">High Priority</div>
                      <div>{route.pickups.filter(p => p.priority === 'high').length} pickups</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-700">Completion</div>
                      <div>
                        {route.pickups.filter(p => p.status === 'completed').length} / {route.pickups.length} done
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-700">Efficiency</div>
                      <div className="capitalize">
                        {route.estimatedDistance < 80 ? 'Excellent' : 
                         route.estimatedDistance < 120 ? 'Good' : 'Fair'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Route Optimization Modal */}
      {selectedRoute && optimization && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">🎯 Route Optimization</h3>
              <button
                onClick={() => { setSelectedRoute(null); setOptimization(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Optimization Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-blue-700">Distance</div>
                    <div className="font-medium">{optimization.totalDistance}km</div>
                  </div>
                  <div>
                    <div className="text-blue-700">Duration</div>
                    <div className="font-medium">{optimization.totalDuration}min</div>
                  </div>
                  <div>
                    <div className="text-blue-700">Fuel Cost</div>
                    <div className="font-medium">${optimization.estimatedFuelCost}</div>
                  </div>
                  <div>
                    <div className="text-blue-700">Efficiency</div>
                    <div className={`font-medium capitalize ${
                      optimization.efficiency === 'excellent' ? 'text-green-600' :
                      optimization.efficiency === 'good' ? 'text-blue-600' :
                      optimization.efficiency === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {optimization.efficiency}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Optimized Order</h4>
                <div className="space-y-2">
                  {optimization.optimizedOrder.map((pickupId, index) => {
                    const pickup = selectedRoute.pickups.find(p => p.id === pickupId);
                    return pickup && (
                      <div key={pickupId} className="flex items-center p-2 bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{pickup.customerName}</div>
                          <div className="text-xs text-gray-600">
                            {pickup.address.split(',').slice(0, 2).join(', ')}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-gray-600">{formatTime(pickup.timeWindow.start)}</div>
                          <div className={`font-medium ${getPriorityColor(pickup.priority)}`}>
                            {pickup.priority}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => { setSelectedRoute(null); setOptimization(null); }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                  Apply Optimization
                </button>
                <button
                  onClick={() => { setSelectedRoute(null); setOptimization(null); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}