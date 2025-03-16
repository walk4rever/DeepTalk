import React, { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
  });
  
  const [advanced, setAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'temperature' || name === 'topP' || name === 'maxTokens'
        ? parseFloat(value)
        : value
    });
    setSaved(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings to local storage
    localStorage.setItem('deeptalk-settings', JSON.stringify(settings));
    setSaved(true);
    
    // In a real application, you might want to make an API call to save settings on the server
    // This would typically include authentication and validation
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your DeepTalk experience
          </p>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Model settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Model Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure the AI model parameters for your conversations.
            </p>
            
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="modelId" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <select
                  id="modelId"
                  name="modelId"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={settings.modelId}
                  onChange={handleChange}
                >
                  <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
                  <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
                  <option value="anthropic.claude-3-opus-20240229-v1:0">Claude 3 Opus</option>
                  <option value="amazon.titan-text-express-v1">Amazon Titan Text Express</option>
                </select>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  name="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={handleChange}
                  className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>More precise</span>
                  <span>More creative</span>
                </div>
              </div>
              
              {advanced && (
                <>
                  <div className="sm:col-span-3">
                    <label htmlFor="topP" className="block text-sm font-medium text-gray-700">
                      Top P: {settings.topP}
                    </label>
                    <input
                      type="range"
                      id="topP"
                      name="topP"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.topP}
                      onChange={handleChange}
                      className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                      Max Response Length (tokens): {settings.maxTokens}
                    </label>
                    <input
                      type="number"
                      id="maxTokens"
                      name="maxTokens"
                      min="100"
                      max="8000"
                      step="100"
                      value={settings.maxTokens}
                      onChange={handleChange}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
              
              <div className="sm:col-span-6">
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-500"
                  onClick={() => setAdvanced(!advanced)}
                >
                  {advanced ? 'Hide advanced options' : 'Show advanced options'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8">
            <div className="flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save Settings
              </button>
            </div>
          </div>
          
          {saved && (
            <div className="mt-4 text-center text-sm text-green-600">
              Settings saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
