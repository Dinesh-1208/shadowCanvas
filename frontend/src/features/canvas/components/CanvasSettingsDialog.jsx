import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export default function CanvasSettingsDialog({ isOpen, onClose, canvas }) {
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [bgColor, setBgColor] = useState('#ffffff');

    // Sync state when opening
    useEffect(() => {
        if (isOpen) {
            setWidth(canvas.canvasSize?.width || 1920);
            setHeight(canvas.canvasSize?.height || 1080);
            setBgColor(canvas.backgroundColor || '#ffffff');
        }
    }, [isOpen, canvas.canvasSize, canvas.backgroundColor]);

    const handleSave = () => {
        canvas.setCanvasSize({ width, height });
        canvas.setBackgroundColor(bgColor);
        onClose();
    };

    const colors = [
        '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Grays
        '#fff1f2', '#fff7ed', '#fefce8', '#f0fdf4', // Tints
        '#eff6ff', '#eef2ff', '#faf5ff', '#1e293b'  // Tints + Dark
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Canvas Settings"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </>
            }
        >
            <div className="space-y-6">

                {/* Dimensions */}
                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimensions</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-width">Width (px)</Label>
                            <Input
                                id="c-width"
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-height">Height (px)</Label>
                            <Input
                                id="c-height"
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Background Color */}
                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Color</Label>
                    <div className="grid grid-cols-6 gap-2">
                        {colors.map(c => (
                            <button
                                key={c}
                                onClick={() => setBgColor(c)}
                                className={`w-8 h-8 rounded-full border transition-all ${bgColor === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105 border-gray-200'}`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                        <label className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs text-gray-500 font-bold">+</span>
                            <input
                                type="color"
                                className="sr-only"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                            />
                        </label>
                    </div>
                </div>

            </div>
        </Modal>
    );
}
