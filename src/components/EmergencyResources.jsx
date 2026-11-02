import { useState, useEffect } from 'react';

const OFFICIAL_RESOURCES = [
  {
    name: 'Lee County Emergency Management',
    county: 'Lee County (Fort Myers, Cape Coral, Sanibel, Estero)',
    url: 'https://www.leefl.gov/584/Emergency-Management',
    description: 'Official evacuation zones, shelter status, and local emergency alerts.',
  },
  {
    name: 'Collier County Emergency Management',
    county: 'Collier County (Naples, Marco Island, Golden Gate)',
    url: 'https://www.collier.gov/Public-Safety/Emergency-Management',
    description: 'Evacuation zones, shelter openings, and emergency coordination.',
  },
  {
    name: 'Charlotte County Emergency Management',
    county: 'Charlotte County (Punta Gorda, Port Charlotte)',
    url: 'https://www.charlottecountyfl.gov/departments/emergency-management/',
    description: 'Disaster planning, evacuation route information, and shelter lists.',
  },
  {
    name: 'Florida Disaster (Florida Division of Emergency Management)',
    county: 'Statewide (Florida)',
    url: 'https://www.floridadisaster.org/',
    description: 'Statewide storm advisories, emergency orders, and FEMA assistance links.',
  },
];

export default function EmergencyResources({ services }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    services.getEmergencyResources()
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) {
          setData({
            status: 'unavailable',
            message: 'Live emergency information is not connected.',
            shelters: [],
            advisories: [],
          });
        }
      });
    return () => {
      active = false;
    };
  }, [services]);

  const isUnavailable = !data || data.status === 'unavailable';

  return (
    <section
      className="panel no-print mb-8 border border-emerald-900/15 bg-white p-6"
      aria-labelledby="resources-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-900/10 pb-4 mb-4">
        <div>
          <h2 id="resources-heading" className="text-xl font-bold text-emerald-950 sm:text-2xl m-0">
            Emergency Resources & Official Contacts
          </h2>
          <p className="text-xs text-emerald-900/90 mt-1">
            County portals listed by Florida’s official emergency management directory. Live statuses are not connected.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-slate-400"></span>
          <span>Live Feed: {data?.status || 'Checking…'}</span>
        </div>
      </div>

      {isUnavailable && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-950">
          <p className="font-semibold text-amber-900">
            Live Feed Notice
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            {data?.message || 'Live emergency feeds are not connected.'} Official evacuation zones, shelter status, and boil-water notices must always be verified directly through your county’s Emergency Management Division. StormGuard does not fabricate evacuation orders or estimate surge heights.
          </p>
        </div>
      )}

      {/* Official County Links Directory */}
      <div>
        <p className="text-xs text-emerald-900/90 mb-3">Directory links checked November 2, 2026. <a className="underline" href="https://www.floridadisaster.org/planprepare/counties/" target="_blank" rel="noopener noreferrer">Florida county directory</a></p>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 m-0 mb-3">
          Official County Emergency Management Portals
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OFFICIAL_RESOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between rounded-lg border border-emerald-900/10 bg-emerald-50/20 p-3.5 transition-colors hover:border-emerald-800/30 hover:bg-emerald-50/50 focus:outline-none"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">
                    {source.name}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-emerald-800">
                  {source.county}
                </p>
                <p className="mt-1.5 text-xs text-emerald-900/90">
                  {source.description}
                </p>
              </div>
              <span className="mt-2 text-[11px] font-semibold text-emerald-900 underline">
                Visit official portal
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
