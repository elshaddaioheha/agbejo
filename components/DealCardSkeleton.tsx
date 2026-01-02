export const DealCardSkeleton = () => (
  <div className="bg-white rounded-[32px] card-shadow p-8 border border-gray-100 animate-pulse">
    <div className="flex justify-between items-center mb-8">
      <div className="h-4 bg-gray-100 rounded-lg w-16"></div>
      <div className="h-4 bg-gray-100 rounded-lg w-24"></div>
    </div>

    <div className="space-y-6 mb-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-2 bg-gray-50 rounded-full w-20"></div>
          <div className="h-4 bg-gray-100 rounded-full w-32"></div>
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div className="h-2 bg-gray-50 rounded-full w-16"></div>
          <div className="h-4 bg-gray-100 rounded-full w-28"></div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 h-24 flex flex-col items-center justify-center">
        <div className="h-2 bg-gray-100 rounded-full w-24 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded-full w-32"></div>
      </div>
    </div>

    <div className="h-14 bg-gray-100 rounded-[20px] w-full"></div>
  </div>
);
