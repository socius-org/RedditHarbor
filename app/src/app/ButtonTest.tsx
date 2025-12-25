'use client';

import { useState } from 'react';

import { Button } from './components/ui/button';

export function ButtonTest() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => {
            setLoading(!loading);
          }}
        >
          Toggle Loading: {loading ? 'ON' : 'OFF'}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Default Variant</h2>
        <div className="flex items-center gap-4">
          <Button size="xs" loading={loading}>
            Extra Small
          </Button>
          <Button size="sm" loading={loading}>
            Small
          </Button>
          <Button size="default" loading={loading}>
            Default
          </Button>
          <Button size="lg" loading={loading}>
            Large
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Outline Variant</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="xs" loading={loading}>
            Extra Small
          </Button>
          <Button variant="outline" size="sm" loading={loading}>
            Small
          </Button>
          <Button variant="outline" size="default" loading={loading}>
            Default
          </Button>
          <Button variant="outline" size="lg" loading={loading}>
            Large
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Secondary Variant</h2>
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="xs" loading={loading}>
            Extra Small
          </Button>
          <Button variant="secondary" size="sm" loading={loading}>
            Small
          </Button>
          <Button variant="secondary" size="default" loading={loading}>
            Default
          </Button>
          <Button variant="secondary" size="lg" loading={loading}>
            Large
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ghost Variant</h2>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="xs" loading={loading}>
            Extra Small
          </Button>
          <Button variant="ghost" size="sm" loading={loading}>
            Small
          </Button>
          <Button variant="ghost" size="default" loading={loading}>
            Default
          </Button>
          <Button variant="ghost" size="lg" loading={loading}>
            Large
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Destructive Variant</h2>
        <div className="flex items-center gap-4">
          <Button variant="destructive" size="xs" loading={loading}>
            Extra Small
          </Button>
          <Button variant="destructive" size="sm" loading={loading}>
            Small
          </Button>
          <Button variant="destructive" size="default" loading={loading}>
            Default
          </Button>
          <Button variant="destructive" size="lg" loading={loading}>
            Large
          </Button>
        </div>
      </div>
    </div>
  );
}
