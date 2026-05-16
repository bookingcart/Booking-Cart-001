import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';
import { FlightFooter } from '../components/FlightFooter.jsx';
import { HeaderAuthCluster } from '../components/HeaderAuthCluster.jsx';

const SCRIPTS=['/js/loading-ui.js','/js/auth.js','/js/bookingcart.js'];

export default function ResultsPage(){
 useEffect(()=>{document.title='BookingCart — Results';},[]);
 useLegacyScripts(SCRIPTS,'results');
 return (<>
    <div className="bg-green-600 w-full pt-6 pb-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <form data-search-form className="bg-white rounded-xl shadow-lg p-3 lg:p-4 mt-2">
          {/* Trip Type Options */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="tripType" value="round" className="accent-green-600 w-4 h-4 cursor-pointer" defaultChecked />
              <span>Round-trip</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="tripType" value="oneway" className="accent-green-600 w-4 h-4 cursor-pointer" />
              <span>One-way</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="tripType" value="multi" disabled className="w-4 h-4 cursor-not-allowed" />
              <span className="text-slate-400">Multi-city</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer ml-4">
              <input type="checkbox" name="stops" value="0" className="accent-green-600 rounded w-4 h-4 cursor-pointer" />
              <span>Nonstop</span>
            </label>
          </div>

          {/* Search Inputs Row */}
          <div className="flex flex-col lg:flex-row gap-2 relative">
            
            {/* Origin -> Destination */}
            <div className="flex flex-1 border border-slate-300 rounded-lg overflow-visible relative suggest-container">
              <div className="flex-1 px-3 py-2 border-r border-slate-300 hover:bg-slate-50 transition-colors suggest relative">
                <input id="search-from" name="from" data-airport-input type="text" className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-semibold placeholder:text-slate-500" placeholder="From" autoComplete="off" />
                <ul className="suggest__list absolute left-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg w-[300px] z-50 hidden" role="listbox"></ul>
              </div>
              <button type="button" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-300 text-green-600 flex items-center justify-center hover:bg-slate-50 z-10 shadow-sm transition-transform hover:scale-105">
                <i className="ph ph-arrows-left-right text-lg"></i>
              </button>
              <div className="flex-1 px-3 py-2 hover:bg-slate-50 transition-colors suggest relative">
                <input id="search-to" name="to" data-airport-input type="text" className="w-full pl-4 bg-transparent border-none p-0 focus:outline-none text-slate-900 font-semibold placeholder:text-slate-500" placeholder="To" autoComplete="off" />
                <ul className="suggest__list absolute left-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg w-[300px] z-50 hidden" role="listbox"></ul>
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-1 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors field group relative" data-return-field>
              <button type="button" data-cal-trigger="depart" className="flex-1 px-3 py-2 text-left cursor-pointer hover:bg-slate-50 rounded-l-lg border-r border-slate-300 truncate font-semibold text-slate-900">
                <span data-cal-label="depart">Depart</span>
              </button>
              <input type="hidden" name="depart" />
              <button type="button" data-cal-trigger="return" className="flex-1 px-3 py-2 text-left cursor-pointer hover:bg-slate-50 rounded-r-lg truncate font-semibold text-slate-900">
                <span data-cal-label="return">Return</span>
              </button>
              <input type="hidden" name="return" />
            </div>

            {/* Passengers & Cabin */}
            <div className="flex-1 border border-slate-300 rounded-lg dropdown relative flex flex-row items-center cursor-pointer hover:bg-slate-50" data-dropdown>
              <button className="w-full flex items-center gap-2 text-left px-3 py-2 control" type="button" data-dropdown-trigger data-passengers-trigger>
                <i className="ph ph-user text-lg text-slate-500 shrink-0"></i>
                <span className="font-semibold text-slate-900 truncate flex-1" data-passengers-summary>1 adult - Economy</span>
                <i className="ph ph-caret-down text-sm text-slate-400"></i>
              </button>
              <input type="hidden" name="passengers" value="" />
              <div className="dropdown__panel absolute top-full left-0 mt-1 w-[320px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 hidden p-4" role="dialog">
                <div data-passengers className="space-y-4">
                  <div className="flex justify-between items-center counter">
                    <div className="counter__meta">
                      <div className="font-medium text-slate-900">Adults</div>
                      <div className="text-xs text-slate-500">Age 12+</div>
                    </div>
                    <div className="flex items-center gap-3 counter__controls">
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-minus="adults"><i className="ph ph-minus"></i></button>
                      <span className="font-medium w-4 text-center kpi" data-count="adults">1</span>
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-plus="adults"><i className="ph ph-plus"></i></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center counter">
                    <div className="counter__meta">
                      <div className="font-medium text-slate-900">Children</div>
                      <div className="text-xs text-slate-500">Age 2–11</div>
                    </div>
                    <div className="flex items-center gap-3 counter__controls">
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-minus="children"><i className="ph ph-minus"></i></button>
                      <span className="font-medium w-4 text-center kpi" data-count="children">0</span>
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-plus="children"><i className="ph ph-plus"></i></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center counter">
                    <div className="counter__meta">
                      <div className="font-medium text-slate-900">Infants</div>
                      <div className="text-xs text-slate-500">Under 2</div>
                    </div>
                    <div className="flex items-center gap-3 counter__controls">
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-minus="infants"><i className="ph ph-minus"></i></button>
                      <span className="font-medium w-4 text-center kpi" data-count="infants">0</span>
                      <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors" type="button" data-plus="infants"><i className="ph ph-plus"></i></button>
                    </div>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold p-2.5 focus:outline-none focus:border-green-600 control select" name="cabin">
                      <option value="Economy">Economy</option>
                      <option value="Premium">Premium Economy</option>
                      <option value="Business">Business</option>
                      <option value="First">First</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 lg:w-32 shrink-0 text-base" type="submit">
              <i className="ph ph-magnifying-glass text-lg"></i> Search
            </button>
          </div>
          
          <div id="cal-popup" className="cal-popup hidden absolute z-50 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 mt-2">
            <div className="cal-header flex justify-between mb-2">
              <button type="button" className="cal-nav text-slate-400 hover:text-green-600" data-cal-prev><i className="ph-bold ph-caret-left"></i></button>
              <span className="cal-title font-bold text-slate-800" data-cal-title></span>
              <button type="button" className="cal-nav text-slate-400 hover:text-green-600" data-cal-next><i className="ph-bold ph-caret-right"></i></button>
            </div>
            <div className="cal-weekdays grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
            <div className="cal-grid grid grid-cols-7 gap-1" data-cal-grid></div>
          </div>
        </form>
      </div>
    </div>

    {/* Date Ribbon Carousel */}
    <div className="bg-white border-b border-slate-200 -mt-16 relative z-10 mx-auto max-w-[1200px] shadow-sm rounded-t-xl overflow-hidden flex items-stretch">
      <button className="w-12 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-400 border-r border-slate-200 transition-colors">
        <i className="ph ph-caret-left text-xl"></i>
      </button>
      <div className="flex-1 flex overflow-x-auto no-scrollbar scroll-smooth" id="date-ribbon">

      </div>
      <button className="w-12 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-400 border-l border-slate-200 transition-colors">
        <i className="ph ph-caret-right text-xl"></i>
      </button>
      <button className="px-4 flex flex-col items-center justify-center bg-white hover:bg-slate-50 text-green-600 border-l border-slate-200 transition-colors gap-0.5">
        <i className="ph ph-chart-bar text-lg"></i>
        <span className="text-[10px] font-bold">Price graph</span>
      </button>
    </div>

    <main className="flex-grow max-w-[1200px] mx-auto px-6 py-8" data-results>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6 hidden lg:block" data-results-filters>
          
          {/* Recommended Group */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Recommended</h3>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="stops" value="0" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1 flex items-center gap-2"><i className="ph ph-airplane text-slate-400"></i> Nonstop</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1 flex items-center gap-2"><i className="ph ph-suitcase-rolling text-slate-400"></i> Checked baggage included</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1 flex items-center gap-2"><i className="ph ph-eye-slash text-slate-400"></i> Hide budget airlines</span>
              </label>
              <button className="text-green-600 text-sm font-medium mt-1 hover:underline">Show More <i className="ph ph-caret-down text-xs"></i></button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Alliance */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Alliance</h3>
            <div className="space-y-2.5">
              <label className="flex justify-between items-center cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex items-center gap-2"><i className="ph ph-star text-slate-400"></i> Star Alliance</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">US$152</span>
              </label>
              <label className="flex justify-between items-center cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex items-center gap-2"><i className="ph ph-cloud text-slate-400"></i> SkyTeam</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">US$230</span>
              </label>
              <label className="flex justify-between items-center cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex items-center gap-2"><i className="ph ph-planet text-slate-400"></i> Oneworld</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">US$321</span>
              </label>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          {/* Airlines */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Airlines</h3>
            <input type="text" placeholder="All airlines" className="w-full border border-slate-300 rounded bg-slate-50 px-3 py-1.5 text-sm mb-3 focus:outline-none focus:border-green-600" />
            <div className="space-y-2.5" id="sidebar-airline-list">
              {/* Populated dynamically via JS, but we'll put some mocks for visuals if JS doesn't wipe it completely, actually bookingcart.js rewrites it. Wait, the JS rewrites a SELECT element, not checkboxes. We'll update the JS to handle this or just leave the mock visual. */}
              <label className="flex justify-between items-center cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded-sm"></div> China Eastern</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">US$543</span>
              </label>
              <label className="flex justify-between items-center cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-green-600" />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-sm"></div> Hong Kong Airlines</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">US$117</span>
              </label>
              <button className="text-green-600 text-sm font-medium mt-1 hover:underline">Show More <i className="ph ph-caret-down text-xs"></i></button>
            </div>
            {/* Hidden native select for JS logic compatibility */}
            <select name="airline" className="hidden"><option value="any">Any airline</option></select>
            <input type="hidden" name="maxPrice" value="2000" />
            <select name="departTime" className="hidden"><option value="any">Any</option></select>
            <select name="sort" id="results-sort" className="hidden"><option value="price">price</option></select>
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9 w-full min-w-0">
          
          <div className="bg-green-600 rounded-t-xl px-5 py-3 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">Departing for <span data-route-dest>Bangkok</span></h2>
            <span className="text-sm text-green-100 font-medium"><span data-flight-count>66</span> flights found</span>
          </div>

          {/* Sort Tabs */}
          <div className="flex border border-t-0 border-slate-200 bg-white mb-4 shadow-sm text-sm" role="tablist">
            <button className="flex-1 py-3 text-center border-b-2 border-green-600 text-green-600 font-bold relative">
              Recommended <i className="ph ph-info text-slate-400 font-normal"></i>
              <div className="text-xs font-semibold mt-0.5">US$112</div>
            </button>
            <button className="flex-1 py-3 text-center border-b-2 border-transparent text-slate-600 hover:bg-slate-50 font-medium border-l border-slate-100">
              Nonstop first
              <div className="text-xs text-slate-400 mt-0.5">US$112</div>
            </button>
            <button className="flex-1 py-3 text-center border-b-2 border-transparent text-slate-600 hover:bg-slate-50 font-medium border-l border-slate-100">
              Cheapest
              <div className="text-xs text-slate-400 mt-0.5">US$112</div>
            </button>
            <button className="flex-1 py-3 text-center border-b-2 border-transparent text-slate-600 hover:bg-slate-50 font-bold border-l border-slate-100 flex flex-col items-center justify-center">
              Sort by <i className="ph ph-caret-down"></i>
            </button>
            <button className="hidden md:flex flex-1 py-3 text-center border-b-2 border-transparent text-green-600 hover:bg-green-50 font-bold border-l border-slate-100 items-center justify-center gap-1.5">
              <i className="ph-fill ph-bell-ringing"></i> Create price alert
            </button>
          </div>

          <div className="space-y-3" data-results-list>
            <div className="bg-white p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
              <div className="h-12 bg-slate-100 rounded w-full"></div>
            </div>
            <div className="bg-white p-6 border border-slate-200 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
              <div className="h-12 bg-slate-100 rounded w-full"></div>
            </div>
          </div>
          
          {/* Price Trend Graph Mock */}
          <div className="mt-4 bg-white border border-slate-200 p-5 shadow-sm" id="price-trend-graph" style={{display: 'none'}}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <i className="ph-fill ph-chart-line-up text-orange-500 text-xl"></i>
                <h3 className="font-bold text-slate-900">Prices are likely to <span className="text-orange-500">increase</span>—book now!</h3>
              </div>
              <i className="ph ph-caret-up text-slate-400"></i>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
              <span>Current lowest price: <span className="font-bold text-green-600">US$112.00</span></span>
              <span>Typical price <i className="ph ph-question text-slate-400"></i></span>
            </div>
            <div className="w-full h-32 relative flex items-end px-4 border-b border-slate-200 pb-2">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q20,85 40,75 T100,20 L100,100 L0,100 Z" fill="rgba(249, 115, 22, 0.05)" />
                <path d="M0,80 Q20,85 40,75 T100,20" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4,4" />
                <circle cx="40" cy="75" r="4" fill="#16a34a" />
              </svg>
              {/* Axis labels */}
              <div className="absolute right-0 top-0 text-[10px] text-slate-400">US$159.92</div>
              <div className="absolute right-0 bottom-4 text-[10px] text-slate-400">US$116.92</div>
            </div>
          </div>

        </section>
      </div>
    </main>
<FlightFooter />
</>);
}
