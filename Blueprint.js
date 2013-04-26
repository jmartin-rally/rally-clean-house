
Ext.define( 'Pxs.Blueprint', {
    extend: 'Ext.Container',
    alias: 'widget.pxsblueprint',
    layout: 'fit',
    sprites: {},
    config: {
        /**
         * @cfg {Number} height The height of the blueprint.
         */
        height: 100,
        /**
         * @cfg {Number} width The width of the blueprint.
         */
        width: 100
    },
    selected_sprite: null,
    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    initComponent:function() {
        this.callParent(arguments);
        //TODO: separate events for drop, add, remove sprites
        this.addEvents(
            /**
             * @event
             * Fires after a square is moved
             * @param {Pxs.Blueprint} this
             * @param {Ext.draw.Sprite} sprite The sprite that was dropped onto the canvas
             */
            'afterdrop'
        );
        this._startup();
    },
    _startup: function() {
        this.drawComponent = Ext.create('Ext.draw.Component',{
            viewBox: false
        });
        this.add(this.drawComponent).show();

        if ( !this.rendered ) {
            this.on('afterrender', this._drawBoard, this );
        } else {
            this._drawBoard();
        }
    },
    _drawBoard: function() {
        var me = this;

        this.redraw();
    },
    redraw: function() {
        var me = this;
        this.drawComponent.surface.add({ 
            type: 'rect', 
            width: me.width, 
            height: me.height, 
            stroke: 'black',
            'stroke-width': 2,
            x: 0,
            y: 0
        }).show(true);
        for ( var sprite_name in this.sprites ) {
            if ( this.sprites.hasOwnProperty(sprite_name) && this.drawComponent.surface ) {
                this.drawComponent.surface.add( this.sprites[sprite_name] ).show(true);
            }
        }
    },
    getPositions: function() {
        window.console && console.log( this.sprites );
        var save_array = [];
        for ( var id in this.sprites ) {
            if ( this.sprites.hasOwnProperty(id) ) {
                save_array.push({
                    id: id,
                    x: this.sprites[id].x,
                    y: this.sprites[id].y
                });
            }
        }
        return save_array;
    },
    toggleSprite: function(rowmodel,record,index, x, y) {
        window.console && console.log("Toggling sprite",record.get('Name'), record.get('Age'));
        window.console && console.log("Given x,y:", x, y );
        var me = this;
        var name = record.get('ObjectID');
        if ( !x ) { x = 15; }
        if ( !y ) { y = 15; }
        if ( rowmodel ) { rowmodel.deselectAll(true); }
        if ( this.sprites[name] ) {
            this.drawComponent.surface.removeAll(true);
            delete this.sprites[name];
            this.redraw();
            this.fireEvent('afterdrop',this,this.sprites[name]);
        } else {
            var age = record.get('Age');
            var fill_color = this._getFillColor(age);
            
            if ( record.get('HomeStates') && record.get('HomeStates') == "In Progress" ) {
                fill_color = "yellow";
            }
            
            var up = function(sprite,target,opts) {
                var new_x = sprite.attr.translation.x + sprite.attr.x;
                var new_y = sprite.attr.translation.y + sprite.attr.y;
                
                this.sprites[name].x = new_x;
                this.sprites[name].y = new_y;
                window.console && console.log( new_x, new_y );
                this.fireEvent('afterdrop',this,this.sprites[name]);
            };
            var over = function(sprite,target,opts) {
                if ( rowmodel ) {
                    rowmodel.select(index,false,true);
                }
            };
            var out = function(sprite,target,opts) {
               if ( rowmodel ) {
                    rowmodel.deselectAll(true);
                }
            };
            var side = 30;
            if ( record.get('PlanEstimate') ) { side = side * record.get('PlanEstimate'); }
            
            if ( ! this.sprites[name] ) {
                this.sprites[name] = { 
                    type: 'rect', 
                    width: side, 
                    height: side, 
                    stroke: 'blue',
                    fill: fill_color,
                    'stroke-width': 2,
                    x: x,
                    y: y,
                    draggable: true,
                    listeners: {
                        mouseover: over,
                        mouseout: out,
                        mouseup: up,
                        scope: this
                    }
                };
                this.drawComponent.surface.add( this.sprites[name] ).show(true);
                window.console && console.log("x,y",x,y);
                if ( x === 15 && y === 15) {
                    this.fireEvent('afterdrop',this,this.sprites[name]);
                }
        
            }
        }

    },
//    removeSprites: function() {
//        this.sprites = {};
//        this.drawComponent.surface.removeAll(true);
//        this._drawBoard();
//    },
    _getFillColor: function(age) {
        var color = 'white';
        if ( age !== undefined ) {
            if ( age < 14 ) {
                var percentage_through = 1 - ( (14-age)/14 ) ;
                
                var green =  parseInt(255 - (100*percentage_through), 10) ;
                var blue = parseInt(percentage_through*100,10);
                color = 'rgb(0,' + green + ',' + blue + ')';
            } else if ( age < 42) {
                var blue = parseInt(((42-age)/28) * 255, 10) ;
                var red = parseInt(255*age/42,10);
                color = 'rgb('+red+',0,'+blue+')';
                
            } else {
                color = 'red';
            }
        }
        window.console && console.log( color );
        return color;
    }
});
