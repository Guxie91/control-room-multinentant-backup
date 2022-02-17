import { Component, Input, OnInit } from '@angular/core';
import { EtsiMessage } from 'src/app/models/etsi-message.model';

@Component({
  selector: 'app-event-icon',
  templateUrl: './event-icon.component.html',
  styleUrls: ['./event-icon.component.css']
})
export class EventIconComponent implements OnInit {

  @Input() event!: EtsiMessage;
  unknown = false;

  constructor() { }

  ngOnInit(): void {
    if(this.event.category !="roadworks" &&
    this.event.category !="weather" &&
    this.event.category !="info" &&
    this.event.category !="traffic" &&
    this.event.category !="pedestrians" &&
    this.event.category !="cars" &&
    this.event.category !="emergency"){
      this.unknown = true;
    }
  }

}
