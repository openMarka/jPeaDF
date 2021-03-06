var jPeaDFTable = function(h, t, options) {
    this.data = $.extend(true, [], t);// extended in case the array is used again!
    this.headers = $.extend(true, [], h);// extended in case the array is used again!
    this.debug = {creation: false};
    //this.debug = false;
    this.parent = null;
    this.pdf_obj = null;

    this.options = {};
    createStandardOptions(this, options);
    this.options.cell_padding = (options && options.cell_padding) || 3;
    this.options.cell_header_fill = (options && options.cell_header_fill) || [0, 0, 0, 100];
    this.options.cell_row_fill = (options && options.cell_row_fill) || [0, 0, 0, 0];
    this.options.cell_line = (options && options.cell_line) || [200, 200, 200];
    this.options.header_height = (options && options.header_height) || this.options.font_size * 1.5;
    this.options.row_height = (options && options.row_height) || this.options.font_size * 1.5;
    this.options.line_width = (options && options.line_width) || [.1];
    this.options.halign = (options && options.halign) || 'c';
    this.options.valign = (options && options.valign) || 'm';
    this.options.col_widths = [];
    this.options.row_heights = [];

}

jPeaDFTable.prototype.setPdfObj = function(obj) {
    this.pdf_obj = obj;
}

jPeaDFTable.prototype.setParent = function(p) {
    this.parent = p;
}


jPeaDFTable.prototype.calculateSize2 = function(parent) {
    var obj = this.pdf_obj;
    // ****** Updating the position based on the margin//
    obj.doc.setFontSize(this.options.font_size);// set the font size of this item
    applyChildSize(parent, this); // this applies the inital widths and heights

    obj.ypos = obj.ypos + this.options.margin_top;
    if (obj.ypos > obj.options.height - obj.options.padding_bottom) {
        obj.goToNextPage();
        obj.ypos = obj.options.padding_top;
    }


    this.start_y_page = obj.doc.getPage();
    this.start_y_pos = obj.ypos;

    //for header
    obj.doc.setFontSize(this.options.font_size);
    var temp_total_space = this.options.width;
    var temp_total_count = this.headers.length;
    var temp_tableHeaderHeight = this.options.header_height;

    // here we calculate the width of headers and get the number of lines for headers- since line wraps are required!
    for (var i = 0; i < this.headers.length; i++) {// for every cell
        var v = this.headers[i];
        var temp_cell_width = 20;
        if (v.width) {
            temp_cell_width = obj.getSizeByPercentage(v.width, this.options.width, 0);
            temp_total_space -= temp_cell_width;
            this.options.col_widths.push(temp_cell_width);
            temp_total_count--;
        }
        // get colWidths!
        this.options.col_widths.push(temp_cell_width);// default col width
        // split header!
        var splits = obj.doc.splitTextToSize(v.value.toString(), temp_cell_width - (this.options.cell_padding * 2), {});
        var overflow = v.style ? (v.style.overflow) : this.options.overflow;
        v.value = overflow ? splits : [splits[0]];// if there is an overflow
        temp_tableHeaderHeight = (this.options.line_spacing * v.value.length) + (this.options.cell_padding * 2);
        this.options.header_height = Math.max(temp_tableHeaderHeight, this.options.header_height);
    }
    // now for the remaining
    var temp_remaining = 10;
    try {
        var tsr = temp_total_space / temp_total_count;
        temp_remaining = Math.max(temp_remaining, tsr);
    } catch (e) {
        // do nothing 
    }
    
    // give every column that doesnt have a specified initial width/percentage to equally sahre the remainder of the available width
    for (var i = 0; i < this.headers.length; i++) {
        var v = this.headers[i];
        if (!v.width) {
            this.options.col_widths[i] = temp_remaining;
        }
    }

    // add the header!-> go to next page if the header is too large
    if (obj.ypos + this.options.header_height > obj.options.height - obj.options.padding_bottom) {
        obj.goToNextPage();
        obj.ypos = obj.options.padding_top;
    }
    
    // update this since we dont want extra stuff here
    this.start_y_pos = obj.ypos;
    this.start_y_page = obj.doc.getPage();
    this.total_height += this.options.header_height;
    obj.ypos += this.options.margin_top; // update the position of the pointer
    obj.ypos += this.options.header_height;


    // now work out widths and heights of remainder of table
    for (var krow = 0; krow < this.data.length; krow++) {// for every row
        var vrow = this.data[krow];
        // get highest height height
        var highest_height = 0;
        var temp_tableCellHeight = 0;

        for (var kcell = 0; kcell < vrow.length; kcell++) {// for every cell
            var vcell = vrow[kcell];
            var colw = this.options.col_widths[kcell];// col width required when working out line wrap!

            var splits = obj.doc.splitTextToSize(vcell.value.toString(), colw - (this.options.cell_padding * 2), {});
            // we calculate overflow- if true we split the lines, otherwise we cut the lines on the first 1
            var overflow = vcell.style ? (vcell.style.overflow) : this.options.overflow;
            vcell.value = overflow ? splits : [splits[0]];// if there is an overflow
            temp_tableCellHeight = (this.options.line_spacing * vcell.value.length) + (this.options.cell_padding * 2);
            highest_height = Math.max(temp_tableCellHeight, highest_height);
        }
        // if it exceeds page bounds= go to next page...for each row
        if (obj.ypos + highest_height > obj.options.height - obj.options.padding_bottom) {
            obj.goToNextPage();
            obj.ypos = obj.options.padding_top;
        }
        obj.ypos += highest_height;
        this.total_height += highest_height;
    }

    this.end_y_pos = obj.ypos;
    this.end_y_page = obj.doc.getPage();

}

jPeaDFTable.prototype.draw2 = function() {
    // the main settongs for the 
    var obj = this.pdf_obj;
    // go to the starting page of the table!
    obj.goToPage(this.start_y_page);
    obj.ypos = this.start_y_pos;

    var current_pos_x = 0;
    var temp_ypos = 0;
    var temp_page = 0;

    if (this.options.floating) {
        temp_ypos = obj.ypos;
        temp_page = obj.doc.getPage();
    }
    
    for (var i = 0; i < this.headers.length; i++) {// for every cell
        var v = this.headers[i];
        if (v.style) {
            obj.setLineWidth(v.style.line_width, this.options.line_width);
            obj.setFill(v.style.fill, this.options.cell_header_fill);
            obj.setLineColor(v.style.line_color, this.options.cell_line);
            obj.setColor(v.style.color, this.options.font_color);
            obj.setStyle(v.style.style);
            obj.doc.rect(this.posXStart + current_pos_x, obj.ypos, this.options.col_widths[i], this.options.header_height, 'FD');
            obj.drawSplitText(v.value, this.options.font_size, this.options.line_spacing, this.options.col_widths[i], this.options.header_height, this.posXStart + current_pos_x, 0, [this.options.cell_padding, this.options.cell_padding, this.options.cell_padding, this.options.cell_padding], vcell.style.halign || this.options.halign, vcell.style.valign || this.options.valign, false);
        } else {
            obj.setLineWidth(null, this.options.line_width);
            obj.setFill(null, this.options.cell_header_fill);
            obj.setLineColor(null, this.options.cell_line);
            obj.setColor(null, this.options.font_color);
            obj.setStyle(null);
            obj.doc.rect(this.posXStart + current_pos_x, obj.ypos, this.options.col_widths[i], this.options.header_height, 'FD');
            obj.drawSplitText(v.value, this.options.font_size, this.options.line_spacing, this.options.col_widths[i], this.options.header_height, this.posXStart + current_pos_x, 0, [this.options.cell_padding, this.options.cell_padding, this.options.cell_padding, this.options.cell_padding], this.options.halign, this.options.valign, false);
        }
        current_pos_x += this.options.col_widths[i];
    }
    obj.ypos += this.options.header_height;

    //for rows
    obj.doc.setFontSize(this.options.font_size);

    for (var krow = 0; krow < this.data.length; krow++) {// for every cell
        var vrow = this.data[krow];
        // get highest height height
        var highest_height = 0;
        var temp_tableCellHeight = 0;
        for (var kcell = 0; kcell < vrow.length; kcell++) {// for every cell
            var vcell = vrow[kcell];
            var colw = this.options.col_widths[kcell];
            temp_tableCellHeight = (this.options.line_spacing * vcell.value.length) + (this.options.cell_padding * 2);
            highest_height = Math.max(temp_tableCellHeight, highest_height);
        }

        // if it exceeds page bounds= add for each row
        if (obj.ypos + highest_height > obj.options.height - obj.options.padding_bottom) {
            obj.goToNextPage();
            obj.ypos = obj.options.padding_top;
        }

        current_pos_x = 0;
        for (var kcell = 0; kcell < vrow.length; kcell++) {// for every cell
            var vcell = vrow[kcell];
            var colw = this.options.col_widths[kcell];
            // individual settings
            if (vcell.style) {
                obj.setLineWidth(vcell.style.line_width, this.options.line_width);
                obj.setFill(vcell.style.fill, this.options.cell_row_fill);
                obj.setLineColor(vcell.style.line_color, this.options.cell_line);
                obj.setColor(vcell.style.color, this.options.font_color);
                obj.setStyle(vcell.style.style);
                obj.doc.rect(this.posXStart + current_pos_x, obj.ypos, colw, highest_height, 'FD');
                obj.drawSplitText(vcell.value, this.options.font_size, this.options.line_spacing, colw, highest_height, this.posXStart + current_pos_x, 0, [this.options.cell_padding, this.options.cell_padding, this.options.cell_padding, this.options.cell_padding], vcell.style.halign || this.options.halign, vcell.style.valign || this.options.valign, false);
            } else {
                obj.setLineWidth(null, this.options.line_width);
                obj.setFill(null, this.options.cell_row_fill);
                obj.setColor(null, this.options.font_color);
                obj.setLineColor(null, this.options.cell_line);
                obj.setStyle(null);
                obj.doc.rect(this.posXStart + current_pos_x, obj.ypos, colw, highest_height, 'FD');
                obj.drawSplitText(vcell.value, this.options.font_size, this.options.line_spacing, colw, highest_height, this.posXStart + current_pos_x, 0, [this.options.cell_padding, this.options.cell_padding, this.options.cell_padding, this.options.cell_padding], this.options.halign, this.options.valign, false);
            }
            current_pos_x += colw;
        }
        obj.ypos += highest_height;
    }

    this.block_ypos = obj.ypos;
    this.block_ypage = obj.doc.getPage();
    //window.console.log(' after table '+this.block_ypos +'  '+this.block_ypage );
    if (this.options.floating) {
        obj.ypos = temp_ypos;
        obj.doc.goToPage(temp_page);
    }
    // revert to standard font!
    this.pdf_obj.doc.setFontSize(this.pdf_obj.options.font_size);
}